import type { ItemID } from './items.js';
import { items } from './items.js';
import type { ResearchID } from './research.js';
import { research } from './research.js';
import type { ShipType } from './ships.js';

export type ProductID = ItemID | ResearchID | ShipType;

export interface Product {
	id: ProductID;
	productionTime: number;
	recipe: Partial<Record<ItemID, number>>;
	requires: Partial<Record<ResearchID, number>>;
}

export type ProductionInfo<T extends ProductID> = {
	id: T;
	time: number;
} | null;

export interface Producer<T extends ProductID> {
	production: ProductionInfo<T>;
	canProduce: ProductID[];
}

export function computeProductionDifficulty(product: Product, recipeScale = 1): number {
	let difficulty = 0;
	for (const [id, amount] of Object.entries(product.recipe) as [ItemID, number][]) {
		const _difficulty = (Math.log10(items.get(id)?.value || 0) + 1) * Math.log10((amount / 1000) * recipeScale + 1);
		difficulty += _difficulty;
	}
	for (const [id, level] of Object.entries(product.requires) as [ResearchID, number][]) {
		const _difficulty = Math.log10(computeProductionDifficulty(research.get(id)!, research.get(id)!.scale ** level));
		difficulty += _difficulty;
	}
	return difficulty;
}
