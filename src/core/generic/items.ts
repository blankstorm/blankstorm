import { config } from '../meta';
import { Producible } from './production';

export interface Item extends Producible {
	rare: boolean;
	value: number;
	weight: number;
}

const items = {
	titanium: { id: 'titanium', productionTime: config.tick_rate, rare: false, value: 1, weight: 1 },
	quartz: { id: 'quartz', productionTime: config.tick_rate, rare: false, value: 2, weight: 0.5 },
	hydrogen: { id: 'hydrogen', productionTime: config.tick_rate, rare: false, value: 4, weight: 1 },
	ancient_tech: { id: 'ancient_tech', productionTime: config.tick_rate, rare: true, value: 1000, weight: 1 },
	code_snippets: { id: 'code_snippets', productionTime: config.tick_rate, rare: true, value: 1000, weight: 1 },
} as const;

export type ItemID = keyof typeof items;

export type ItemCollection<T = number> = Record<ItemID, T>;

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