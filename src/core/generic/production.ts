import type { ResearchID } from './research';
import { research } from './research';
import type { ItemID } from './items';
import { items } from './items';
import type { ShipType } from './ships';

export type ProducibleID = ItemID | ResearchID | ShipType;

export interface Producible {
	id: ProducibleID;
	productionTime: number;
	recipe: Partial<Record<ItemID, number>>;
	requires: Partial<Record<ResearchID, number>>;
}

export type ProductionInfo<T extends ProducibleID> = {
	id: T;
	time: number;
} | null;

export interface Producer<T extends ProducibleID> {
	production: ProductionInfo<T>;
	canProduce: ProducibleID[];
}

export function computeProductionDifficulty(producible: Producible, recipeScale = 1): number {
	let difficulty = 0;
	for (const [id, amount] of Object.entries(producible.recipe)) {
		const _difficulty = (Math.log10(items[id].value) + 1) * Math.log10((amount / 1000) * recipeScale + 1);
		difficulty += _difficulty;
	}
	for (const [id, level] of Object.entries(producible.requires)) {
		const _difficulty = Math.log10(computeProductionDifficulty(research[id], research[id].scale ** level));
		difficulty += _difficulty;
	}
	return difficulty;
}
