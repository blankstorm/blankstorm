import { config } from '../metadata';
import type { Producible } from './production';

export interface Item extends Producible {
	rare: boolean;
	value: number;
	weight: number;
}

export const items = {
	titanium: { id: 'titanium', productionTime: config.tick_rate, rare: false, value: 1, weight: 1 },
	quartz: { id: 'quartz', productionTime: config.tick_rate, rare: false, value: 2, weight: 0.5 },
	hydrogen: { id: 'hydrogen', productionTime: config.tick_rate, rare: false, value: 4, weight: 1 },
	ancient_tech: { id: 'ancient_tech', productionTime: config.tick_rate, rare: true, value: 1000, weight: 1 },
	code_snippets: { id: 'code_snippets', productionTime: config.tick_rate, rare: true, value: 1000, weight: 1 },
} as const;
items satisfies Record<ItemID, Item>;

export type ItemID = keyof typeof items;

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
