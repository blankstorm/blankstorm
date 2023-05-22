import { items } from './generic/items';
import type { ItemCollection, SerializedItemCollection } from './generic/items';

export class Storage extends Map {
	#max = 1;
	constructor(max = 1, initalItems?: ItemCollection) {
		super();
		for (const id of Object.keys(items)) {
			this.set(id, typeof initalItems?.[id] == 'number' ? initalItems[id] : 0);
		}
		this.#max = max;
	}

	get max(): number {
		return this.#max;
	}

	get total(): number {
		return [...this.entries()].reduce((total, [name, amount]) => total + amount * items[name].weight, 0);
	}

	empty(filter) {
		for (const name of this.keys()) {
			if ((filter instanceof Array ? filter.includes(name) : filter == name) || !filter) this.set(name, 0);
		}
	}

	serialize(): SerializedItemCollection {
		return { items: Object.fromEntries([...this]), max: this.#max };
	}

	add(item, amount) {
		this.set(item, this.get(item) + amount);
	}

	addItems(items) {
		for (const [id, amount] of Object.entries(items)) {
			this.add(id, amount);
		}
	}

	remove(item, amount) {
		this.set(item, this.get(item) - amount);
	}

	static FromData(data) {
		return new this(data.max, data.items);
	}
}
