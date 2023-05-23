import { research } from './research';
import type { ResearchCollection } from './research';

export interface Producible {
	recipe?: Partial<ItemCollection<number>>;
	requires?: Partial<ResearchCollection<number>>;
}

export interface Item extends Producible {
	rare: boolean;
	value: number;
	weight: number;
	recipe?: ItemCollection<number>;
}

const items = {
	titanium: { rare: false, value: 1, weight: 1 },
	quartz: { rare: false, value: 2, weight: 0.5 },
	hydrogen: { rare: false, value: 4, weight: 1 },
	ancient_tech: { rare: true, value: 1000, weight: 1 },
	code_snippets: { rare: true, value: 1000, weight: 1 },
};

export type ItemID = keyof typeof items;

export type ItemCollection<T = number> = { [key in ItemID]: T };

const _items: ItemCollection<Item> = items;
export { _items as items };

export interface SerializedItemCollection {
	max: number;
	items: ItemCollection<number>;
}

export interface LootTableEntry {
	rolls: number;
	items: ItemCollection<number>;
}

export type LootTable = LootTableEntry[];

export function computeProductionDifficulty(thing: Producible, recipeScale = 1): number {
	let difficulty = 0;
	for (const [id, amount] of Object.entries(thing.recipe)) {
		const _difficulty = (Math.log10(items[id].value) + 1) * Math.log10((amount / 1000) * recipeScale + 1);
		difficulty += _difficulty;
	}
	for (const [id, level] of Object.entries(thing.requires)) {
		const _difficulty = Math.log10(computeProductionDifficulty(research[id], research[id].scale ** level));
		difficulty += _difficulty;
	}
	return difficulty;
}
