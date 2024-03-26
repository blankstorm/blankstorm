import { ItemID, items as Items } from './generic/items';
import type { ItemContainer, PartialItemContainer } from './generic/items';

export class Storage {
	//public items: Map<ItemID, number> = new Map();

	public constructor(
		public max: number = 1,
		public items: Map<ItemID, number> = new Map()
	) {}

	public get total(): number {
		return [...this.items].reduce((total, [name, amount]) => total + amount * Items[name].weight, 0);
	}

	public empty(filter: ItemID | ItemID[]) {
		for (const name of this.items.keys()) {
			if ((filter instanceof Array ? filter.includes(name) : filter == name) || !filter) this.items.set(name, 0);
		}
	}

	public count(item: ItemID): number {
		return this.items.get(item);
	}

	public addItem(item: ItemID, amount: number) {
		this.items.set(item, this.items.get(item) + amount);
	}

	public addItems(items: Partial<Record<ItemID, number>>) {
		for (const [id, amount] of Object.entries(items)) {
			this.addItem(<ItemID>id, amount);
		}
	}

	public removeItem(item: ItemID, amount?: number) {
		this.items.set(item, typeof amount == 'number' ? this.items.get(item) - amount : 0);
	}

	public removeItems(items: Partial<Record<ItemID, number>>) {
		items = { ...items };
		for (const [id, amount] of Object.entries(items)) {
			this.removeItem(<ItemID>id, amount);
		}
	}

	public toJSON(): ItemContainer {
		return {
			items: <Record<ItemID, number>>Object.fromEntries(this.items),
			max: this.max,
		};
	}

	public static FromJSON({ max, items }: PartialItemContainer, storage = new this()): Storage {
		for (const id of <ItemID[]>Object.keys(Items)) {
			storage.items.set(id, typeof items?.[id] == 'number' ? items[id] : 0);
		}
		storage.max = max;
		return storage;
	}
}
