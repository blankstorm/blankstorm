import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import { map } from 'utilium';
import _items from './data/items.json' with { type: 'json' };
import _recipes from './data/recipes.json' with { type: 'json' };
import _research from './data/research.json' with { type: 'json' };
import type { Player } from './entities/player';
import type { ShipType } from './entities/ships';

export interface RecipeJSON {
	items: Partial<Record<ItemID, number>>;
	location: string[];
	time: number;
	research?: Partial<Record<ResearchID, number>>;
	result: {
		type: string;
		id: string;
		amount?: number;
	};
}

export interface Recipe {
	items: Record<ItemID, number>;
	location: string[];
	time: number;
	research: Record<ResearchID, number>;
	result: {
		type: 'item' | 'entity' | 'research';
		id: string;
		amount: number;
	};
}

export function parseRecipe(json: RecipeJSON): Recipe {
	return {
		...json,
		research: Object.fromEntries((Object.keys(_research) as ResearchID[]).map(id => [id, json.research?.[id] || 0])) as Record<
			ResearchID,
			number
		>,
		items: Object.fromEntries((Object.entries(json.items) as [ItemID, number][]).filter(([_, amount]) => amount > 0)) as Record<
			ItemID,
			number
		>,
		result: {
			amount: 1,
			...json.result,
		} as Recipe['result'],
	};
}

export function getRecipes(resultId: ProductID, location?: string): Recipe[] {
	return _recipes.filter(r => r.result.id === resultId && (!location || r.location.includes(location))).map(parseRecipe);
}

export interface Item {
	rare: boolean;
	value: number;
	weight: number;
	id: ItemID;
}

export type ItemID = keyof typeof _items;

export const items = map(_items);

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

export interface ResearchJSON {
	id: string;
	xp: number;
	scale: number;
	max_level: number;
	recipe: Omit<RecipeJSON, 'result'>;
	tree_position: number[];
}

export interface Research {
	id: ResearchID;
	xp: number;
	scale: number;
	max_level: number;
	recipe: Recipe;
	tree_position: Vector2;
}

export function parseResearch(json: ResearchJSON): Research {
	return {
		...json,
		id: json.id as ResearchID,
		recipe: parseRecipe({ ...json.recipe, result: { type: 'research', id: json.id } }),
		tree_position: Vector2.FromArray(json.tree_position),
	};
}

export type ResearchID = keyof typeof _research;

export const research = new Map<ResearchID, Research>(
	Object.entries(_research).map(([id, json]) => [id, parseResearch(json)]) as [ResearchID, Research][]
);

export function scaleResearchRecipe(id: ResearchID, level: number): Recipe {
	const _ = research.get(id)!,
		recipe = parseRecipe({ ..._.recipe, result: { type: 'research', id } }),
		scale = _.scale ** level;

	for (const id of Object.keys(recipe) as ItemID[]) {
		if (id in recipe.items) recipe.items[id] *= scale;
	}

	recipe.time *= scale;

	return recipe;
}
export function isResearchLocked(id: ResearchID, player: Player): boolean {
	const requires = research.get(id)!.recipe.research;
	for (const item of research.keys()) {
		const needed = requires[item] || 0;
		if ((needed > 0 && player.research[item] < needed) || (needed == 0 && player.research[item] > 0)) {
			return true;
		}
	}
	return false;
}

export type ProductID = ItemID | ResearchID | ShipType;

export type ProductionInfo<T extends ProductID> = {
	id: T;
	time: number;
} | null;

export interface Producer<T extends ProductID> {
	production: ProductionInfo<T>;
	canProduce: ProductID[];
}

export function computeProductionDifficulty(recipe: Recipe, recipeScale = 1): number {
	let difficulty = 0;
	for (const [id, amount] of Object.entries(recipe.items) as [ItemID, number][]) {
		const _difficulty = (Math.log10(items.get(id)?.value || 0) + 1) * Math.log10((amount / 1000) * recipeScale + 1);
		difficulty += _difficulty;
	}
	if (!recipe.research) return difficulty;
	for (const [id, level] of Object.entries(recipe.research) as [ResearchID, number][]) {
		const _difficulty = Math.log10(computeProductionDifficulty(research.get(id)!.recipe, research.get(id)!.scale ** level));
		difficulty += _difficulty;
	}
	return difficulty;
}
