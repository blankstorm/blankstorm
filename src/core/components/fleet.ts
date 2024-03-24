import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { NTuple3 } from '../utils';
import { Component, register } from './component';
import type { ItemID } from '../generic/items';
import { items as Items } from '../generic/items';
import { Ship } from '../entities/Ship';
import type { Combatant } from './combat';

interface Data {
	position: NTuple3;
	ships: string[];
}

@register()
export class Fleet extends Component<Data> implements Combatant {
	public position: Vector3;

	public ships: Set<Ship>;

	public get size(): number {
		return this.ships.size;
	}

	public get power(): number {
		let total = 0;
		for (const ship of this.ships) {
			total += ship.generic.power;
		}
		return total;
	}

	public get items(): Record<ItemID, number> {
		const items = <Record<ItemID, number>>Object.fromEntries(Object.keys(Items).map(i => [i, 0]));
		for (const ship of this.ships) {
			for (const [name, amount] of <[ItemID, number][]>Object.entries(items)) {
				items[name] = +ship.get('storage').count(name) + amount;
			}
		}
		return items;
	}

	public set items(value: Record<ItemID, number>) {
		for (const ship of this.ships) {
			ship.get('storage').empty(Object.keys(value) as ItemID[]);
		}
		this.addItems(value);
	}

	public get totalItems(): number {
		let total = 0;
		for (const ship of this.ships) {
			total += ship.get('storage').total;
		}
		return total;
	}

	public get maxItems(): number {
		let total = 0;
		for (const ship of this.ships) {
			total += ship.get('storage').max * (1 + this._.get('research').research.storage / 20);
		}
		return total;
	}

	public addItems(items: Partial<Record<ItemID, number>>) {
		for (const ship of this.ships) {
			const storage = ship.get('storage');
			let space = storage.max * (1 + this._.get('research').research.storage / 20) - storage.total;
			if (space > 0) {
				for (const [name, amount] of Object.entries(items)) {
					if (Items[name]) {
						const stored = Math.min(space, amount);
						storage.addItem(name as ItemID, stored);
						items[name] -= stored;
						space -= stored;
					} else {
						console.warn(`Failed to add ${amount} ${name} to fleet items: Invalid item`);
					}
				}
			}
		}
		this._.level.emit('fleet.items.change', this.data(), this.items);
	}

	public removeItems(items: Partial<Record<ItemID, number>>) {
		items = { ...items };
		for (const ship of this.ships) {
			const storage = ship.get('storage');
			for (const [item, amount] of <[ItemID, number][]>Object.entries(items)) {
				const stored = Math.min(storage.count(item), amount);
				storage.removeItem(item as ItemID, stored);
				items[item] -= stored;
			}
		}
		this._.level.emit('fleet.items.change', this.data(), this.items);
	}

	public removeAllItems() {
		this.removeItems(Object.fromEntries(Object.keys(Items).map(i => [i, Infinity])) as Record<ItemID, number>);
	}

	public hasItems(items: Partial<Record<ItemID, number>>) {
		items = { ...items };
		for (const ship of this.ships) {
			for (const [item, amount] of <[ItemID, number][]>Object.entries(items)) {
				const stored = Math.min(ship.get('storage').count(item), amount);
				items[item] -= stored;
			}
		}
		return Object.values(items).every(item => item <= 0);
	}

	public data(): Data {
		return {
			position: this.position.asArray(),
			ships: Array.from(this.ships).map(s => s.id),
		};
	}

	public from({ position, ships }: Data): void {
		this.position = Vector3.FromArray(position || [0, 0, 0]);
		this.ships.clear();
		for (const id of ships) {
			const ship = this._.level.getEntityByID<Ship>(id);
			ship.position.addInPlace(this.position);
			
			ship.parent = this._;
			ship.get('owner').owner = this._;
			this.ships.add(ship);
		}
	}
}
