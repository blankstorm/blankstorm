import { items as Items } from '../generic/items';
import type { ItemID } from '../generic/items';
import { research } from '../generic/research';
import type { ResearchID } from '../generic/research';
import { Entity } from './Entity';
import type { SerializedEntity } from './Entity';
import { Ship } from './Ship';
import type { SerializedShip } from './Ship';
import type { System } from '../System';
import type { ShipType } from '../generic/ships';

export interface SerializedPlayer extends SerializedEntity {
	research: Record<ResearchID, number>;
	fleet: string[];
	xp: number;
	xpPoints: number;
}

export class Player extends Entity {
	research = <Record<ResearchID, number>>Object.fromEntries(Object.keys(research).map((k: ResearchID) => [k, 0]));
	fleet: Ship[] = [];
	xp = 0;
	xpPoints = 0;
	speed = 1;
	oplvl?: number;
	get power(): number {
		return this.fleet.reduce((a, ship) => a + (ship.generic.power || 0), 0);
	}

	constructor(id: string, system: System, { fleet }: { fleet: (SerializedShip | Ship | string)[] }) {
		super(id, system);
		for (const shipData of fleet) {
			const ship = shipData instanceof Ship ? shipData : typeof shipData == 'string' ? (system.getNodeByID(shipData) as Ship) : Ship.FromJSON(shipData, system);
			ship.owner = this;
			ship.position.addInPlace(this.absolutePosition);
			this.fleet.push(ship);
		}
		setTimeout(() => system.emit('player.created', this.toJSON()));
	}

	get items(): Record<ItemID, number> {
		const items = Object.fromEntries(Object.keys(Items).map(i => [i, 0])) as Record<ItemID, number>;
		for (const ship of this.fleet) {
			for (const [name, amount] of Object.entries(items)) {
				items[name] = +ship.storage.get(name) + amount;
			}
		}
		return items;
	}

	set items(value: Record<ItemID, number>) {
		for (const ship of this.fleet) {
			ship.storage.empty(Object.keys(value) as ItemID[]);
		}
		this.addItems(value);
	}

	get totalItems(): number {
		return this.fleet.reduce((total, ship) => total + ship.storage.total, 0);
	}

	get maxItems(): number {
		return this.fleet.reduce((total, ship) => total + ship.storage.max * (1 + this.research.storage / 20), 0);
	}

	shipNum(type: ShipType) {
		return this.fleet.reduce((total, ship) => total + +(ship.type == type), 0);
	}

	addItems(items: Partial<Record<ItemID, number>>) {
		for (const ship of this.fleet) {
			let space = ship.storage.max * (1 + this.research.storage / 20) - ship.storage.total;
			if (space > 0) {
				for (const [name, amount] of Object.entries(items)) {
					if (Items[name]) {
						const stored = Math.min(space, amount);
						ship.storage.add(name as ItemID, stored);
						items[name] -= stored;
						space -= stored;
					} else {
						console.warn(`Failed to add ${amount} ${name} to player items: Invalid item`);
					}
				}
			}
		}
		this.system.emit('player.items.change', this.toJSON(), this.items);
	}

	removeItems(items: Partial<Record<ItemID, number>>) {
		items = { ...items };
		for (const ship of this.fleet) {
			for (const [item, amount] of Object.entries(items)) {
				const stored = Math.min(ship.storage.get(item), amount);
				ship.storage.remove(item as ItemID, stored);
				items[item] -= stored;
			}
		}
		this.system.emit('player.items.change', this.toJSON(), this.items);
	}

	removeAllItems() {
		this.removeItems(Object.fromEntries(Object.keys(Items).map(i => [i, Infinity])) as Record<ItemID, number>);
	}

	hasItems(items: Partial<Record<ItemID, number>>) {
		items = { ...items };
		for (const ship of this.fleet) {
			for (const [item, amount] of Object.entries(items)) {
				const stored = Math.min(ship.storage.get(item), amount);
				items[item] -= stored;
			}
		}
		return Object.values(items).every(item => item <= 0);
	}

	reset() {
		this.removeAllItems();
		for (const type of Object.keys(research)) {
			this.research[type] = 0;
		}
		for (const ship of this.fleet) {
			ship.remove();
		}
		this.system.emit('player.reset', this.toJSON());
	}

	remove() {
		this.system.emit('player.removed', this.toJSON());
		super.remove();
	}

	toJSON(): SerializedPlayer {
		return Object.assign(super.toJSON(), {
			fleet: this.fleet.map(ship => ship.id),
			xp: this.xp,
			xpPoints: this.xpPoints,
			research: this.research,
		});
	}

	static FromJSON(data: SerializedPlayer, system: System): Player {
		return <Player>super.FromJSON(data, system, data);
	}
}
