import { items as Items } from '../generic/items';
import type { ItemCollection, ItemID } from '../generic/items';
import { research } from '../generic/research';
import type { ResearchCollection } from '../generic/research';
import { Entity } from './Entity';
import type { SerializedEntity } from './Entity';
import { Ship } from './Ship';
import type { SerializedShip } from './Ship';
import type { Level } from '../Level';
import type { ShipType } from '../generic/ships';

export interface SerializedPlayer extends SerializedEntity {
	research: ResearchCollection<number>;
	fleet: string[];
	xp: number;
	xpPoints: number;
}

export class Player extends Entity {
	research: ResearchCollection<number> = Object.fromEntries(Object.keys(research).map(k => [k, 0])) as ResearchCollection<number>;
	fleet: Ship[] = [];
	xp = 0;
	xpPoints = 0;
	speed = 1;
	oplvl?: number;
	get power(): number {
		return this.fleet.reduce((a, ship) => a + (ship.generic.power || 0), 0);
	}

	constructor(id: string, level: Level, { fleet }: { fleet: (SerializedShip | Ship | string)[] }) {
		super(id, level);
		for (const shipData of fleet) {
			const ship = shipData instanceof Ship ? shipData : typeof shipData == 'string' ? (level.getNodeByID(shipData) as Ship) : Ship.FromJSON(shipData, level);
			ship.owner = ship.parent = this;
			this.fleet.push(ship);
		}
		setTimeout(() => level.emit('player.created', this.toJSON()));
	}

	get items(): ItemCollection {
		const items = Object.fromEntries(Object.keys(Items).map(i => [i, 0])) as ItemCollection;
		for (const ship of this.fleet) {
			for (const [name, amount] of Object.entries(items)) {
				items[name] = +ship.storage.get(name) + amount;
			}
		}
		return items;
	}

	set items(value: ItemCollection) {
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

	addItems(items: Partial<ItemCollection>) {
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
		this.level.emit('player.items.change', this.toJSON(), this.items);
	}

	removeItems(items: Partial<ItemCollection>) {
		items = { ...items };
		for (const ship of this.fleet) {
			for (const [item, amount] of Object.entries(items)) {
				const stored = Math.min(ship.storage.get(item), amount);
				ship.storage.remove(item as ItemID, stored);
				items[item] -= stored;
			}
		}
		this.level.emit('player.items.change', this.toJSON(), this.items);
	}

	removeAllItems() {
		this.removeItems(Object.fromEntries(Object.keys(Items).map(i => [i, Infinity])) as ItemCollection);
	}

	hasItems(items: Partial<ItemCollection>) {
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
		this.level.emit('player.reset', this.toJSON());
	}

	remove() {
		this.level.emit('player.removed', this.toJSON());
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

	static FromJSON(data: SerializedPlayer, level: Level): Player {
		return super.FromJSON(data, level, data) as Player;
	}
}
