import { ItemID, items as Items } from '../generic/items';
import type { ItemContainer, PartialItemContainer } from '../generic/items';
import { Component, register } from './component';

@register()
export class Storage extends Component<PartialItemContainer> {
	public items: Map<ItemID, number> = new Map();

	public max = 1;

	get total(): number {
		return [...this.items].reduce((total, [name, amount]) => total + amount * Items[name].weight, 0);
	}

	empty(filter: ItemID | ItemID[]) {
		for (const name of this.items.keys()) {
			if ((filter instanceof Array ? filter.includes(name) : filter == name) || !filter) this.items.set(name, 0);
		}
	}

	count(item: ItemID): number {
		return this.items.get(item);
	}

	addItem(item: ItemID, amount: number) {
		this.items.set(item, this.items.get(item) + amount);
	}

	addItems(items: Partial<Record<ItemID, number>>) {
		for (const [id, amount] of Object.entries(items)) {
			this.addItem(<ItemID>id, amount);
		}
	}

	removeItem(item: ItemID, amount?: number) {
		this.items.set(item, typeof amount == 'number' ? this.items.get(item) - amount : 0);
	}

	removeItems(items: Partial<Record<ItemID, number>>) {
		items = { ...items };
		for (const [id, amount] of Object.entries(items)) {
			this.removeItem(<ItemID>id, amount);
		}
	}

	data(): ItemContainer {
		return {
			items: <Record<ItemID, number>>Object.fromEntries(this.items),
			max: this.max,
		};
	}

	from({ max, items }: PartialItemContainer) {
		for (const id of <ItemID[]>Object.keys(Items)) {
			this.items.set(id, typeof items?.[id] == 'number' ? items[id] : 0);
		}
		this.max = max;
	}
}
