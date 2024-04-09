import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { ItemID } from './generic/items';
import { items as Items } from './generic/items';
import { Ship } from './entities/ship';
import { CelestialBody } from './entities/body';
import { Player } from './entities/player';
import { Level } from './level';

export interface FleetJSON {
	position: number[];
	ships: string[];
}

export class Fleet extends Set<Ship> {
	public owner: CelestialBody | Player;

	public get level(): Level {
		return this.owner.level;
	}

	public position: Vector3;

	public get power(): number {
		let total = 0;
		for (const ship of this) {
			total += ship.generic.power;
		}
		return total;
	}

	public get items(): Record<ItemID, number> {
		const items = <Record<ItemID, number>>Object.fromEntries(Object.keys(Items).map(i => [i, 0]));
		for (const ship of this) {
			for (const [name, amount] of <[ItemID, number][]>Object.entries(items)) {
				items[name] = +ship.storage.count(name) + amount;
			}
		}
		return items;
	}

	public set items(value: Record<ItemID, number>) {
		for (const ship of this) {
			ship.storage.empty(<ItemID[]>Object.keys(value));
		}
		this.addItems(value);
	}

	public get totalItems(): number {
		let total = 0;
		for (const ship of this) {
			total += ship.storage.total;
		}
		return total;
	}

	public get maxItems(): number {
		let total = 0;
		for (const ship of this) {
			total += ship.storage.max;
		}
		return total;
	}

	public addItems(items: Partial<Record<ItemID, number>>) {
		for (const ship of this) {
			let space = ship.storage.max - ship.storage.total;
			if (space > 0) {
				for (const [name, amount] of <[ItemID, number][]>Object.entries(items)) {
					if (Items[name]) {
						const stored = Math.min(space, amount);
						ship.storage.addItem(name, stored);
						items[name] -= stored;
						space -= stored;
					} else {
						console.warn(`Failed to add ${amount} ${name} to fleet items: Invalid item`);
					}
				}
			}
		}
		this.level.emit('fleet_items_change', this.toJSON(), this.items);
	}

	public removeItems(items: Partial<Record<ItemID, number>>) {
		items = { ...items };
		for (const ship of this) {
			const storage = ship.storage;
			for (const [item, amount] of <[ItemID, number][]>Object.entries(items)) {
				const stored = Math.min(storage.count(item), amount);
				storage.removeItem(item as ItemID, stored);
				items[item] -= stored;
			}
		}
		this.level.emit('fleet_items_change', this.toJSON(), this.items);
	}

	public removeAllItems() {
		this.removeItems(Object.fromEntries(Object.keys(Items).map(i => [i, Infinity])) as Record<ItemID, number>);
	}

	public hasItems(items: Partial<Record<ItemID, number>>) {
		items = { ...items };
		for (const ship of this) {
			for (const [item, amount] of <[ItemID, number][]>Object.entries(items)) {
				const stored = Math.min(ship.storage.count(item), amount);
				items[item] -= stored;
			}
		}
		return Object.values(items).every(item => item <= 0);
	}

	public toJSON(): FleetJSON {
		return {
			position: this.position.asArray(),
			ships: Array.from(this).map(s => s.id),
		};
	}

	public fromJSON({ position, ships }: FleetJSON): void {
		this.position = Vector3.FromArray(position || [0, 0, 0]);
		this.clear();
		for (const id of ships) {
			const ship = this.owner.level.getEntityByID<Ship>(id);
			ship.position.addInPlace(this.position);

			ship.parent = this.owner;
			ship.owner = this.owner;
			this.add(ship);
		}
	}

	public static FromJSON(data: FleetJSON): Fleet {
		const fleet = new Fleet();
		fleet.fromJSON(data);
		return fleet;
	}
}
