import type { Entries } from 'utilium';
import { config } from '../metadata';
import type { Producible } from './production';

export interface Item extends Producible {
	rare: boolean;
	value: number;
	weight: number;
	id: ItemID;
}

const _items = {
	titanium: { id: 'titanium', productionTime: config.tick_rate, rare: false, value: 1, weight: 1, recipe: {}, requires: {} },
	quartz: { id: 'quartz', productionTime: config.tick_rate, rare: false, value: 2, weight: 0.5, recipe: {}, requires: {} },
	hydrogen: { id: 'hydrogen', productionTime: config.tick_rate, rare: false, value: 4, weight: 1, recipe: {}, requires: {} },
	ancient_tech: { id: 'ancient_tech', productionTime: config.tick_rate, rare: true, value: 1000, weight: 1, recipe: {}, requires: {} },
	code_snippets: { id: 'code_snippets', productionTime: config.tick_rate, rare: true, value: 1000, weight: 1, recipe: {}, requires: {} },
} as const;

export type ItemID = keyof typeof _items;

export const items = new Map<ItemID, Item>(Object.entries(_items) as Entries<typeof _items>);

export interface ItemContainer {
	max: number;
	items: Record<ItemID, number>;
}

export interface PartialItemContainer {
	max: number;
	items: Partial<Record<ItemID, number>>;
}

export interface LootTableEntry {
	rolls: number;
	items: Record<ItemID, number>;
}

export type LootTable = LootTableEntry[];
