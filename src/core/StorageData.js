import items from './items.js';

export default class extends Map {
	#max = 1;
	constructor(max = 1, _items = {}) {
		super([...items.keys()].map(i => [i, 0]));
		this.#max = max;
		Object.entries(_items).forEach(([item, amount]) => this.add(item, +amount || 0));
	}

	get max() {
		return this.#max;
	}

	get total() {
		return [...this.entries()].reduce((total, [name, amount]) => total + amount * items.get(name).value, 0);
	}

	empty(filter) {
		for (let name of this.keys()) {
			if ((filter instanceof Array ? filter.includes(name) : filter == name) || !filter) this.set(name, 0);
		}
	}

	serialize() {
		return { items: Object.fromEntries([...this]), max: this.baseMax };
	}

	add(item, amount) {
		this.set(item, this.get(item) + amount);
	}

	addItems(items){
		for(let [id, amount] of Object.entries(items)){
			this.add(id, amount);
		}
	}

	remove(item, amount) {
		this.set(item, this.get(item) - amount);
	}

	static FromData(data){
		return new this(data.max, data.items);
	}
}
