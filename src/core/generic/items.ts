export interface Item {
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
