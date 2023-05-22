import type { Player } from '../entities/Player';
import type { ItemCollection } from './items';

export interface Research {
	recipe: ItemCollection;
	xp: number;
	scale: number;
	max: number;
	requires: Partial<ResearchCollection>;
}

const research = {
	armor: { recipe: { metal: 1000, minerals: 0, fuel: 0, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.5, max: 25, requires: {} },
	laser: { recipe: { metal: 0, minerals: 1000, fuel: 0, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.5, max: 25, requires: {} },
	reload: { recipe: { metal: 4000, minerals: 1500, fuel: 0, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.2, max: 10, requires: {} },
	thrust: { recipe: { metal: 0, minerals: 0, fuel: 1000, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.5, max: 25, requires: {} },
	energy: { recipe: { metal: 0, fuel: 5000, minerals: 1000, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.5, max: 25, requires: {} },
	shields: { recipe: { metal: 2500, minerals: 5000, fuel: 0, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.5, max: 10, requires: { armor: 5 } },
	storage: { recipe: { metal: 10000, minerals: 10000, fuel: 10000, ancient_tech: 0, code_snippets: 0 }, xp: 2, scale: 10, max: 25, requires: {} },
	missle: { recipe: { metal: 10000, minerals: 1000, fuel: 5000, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.5, max: 25, requires: { laser: 5 } },
	regen: { recipe: { metal: 50000, minerals: 10000, fuel: 10000, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.5, max: 25, requires: { reload: 5, armor: 15 } },
	build: { recipe: { metal: 100000, minerals: 0, fuel: 0, ancient_tech: 0, code_snippets: 0 }, xp: 2, scale: 1.5, max: 50, requires: { armor: 10, thrust: 10, reload: 10 } },
	salvage: { recipe: { metal: 250000, minerals: 50000, fuel: 100000, ancient_tech: 0, code_snippets: 0 }, xp: 5, scale: 1.25, max: 25, requires: { build: 5 } },
};

export type ResearchID = keyof typeof research;
export type ResearchCollection<T = number> = { [key in ResearchID]: T };

const _research: ResearchCollection<Research> = research;
export { _research as research };

export function priceOfResearch(id: ResearchID, level: number): ItemCollection {
	const recipe = { ...research[id].recipe };
	for (const item in recipe) {
		for (let i = 1; i < level; i++) {
			recipe[item] *= research[id].scale;
		}
	}
	return recipe;
}
export function isResearchLocked(id: ResearchID, player: Player): boolean {
	for (const item in research[id].requires) {
		if ((research[id].requires[item] > 0 && player.research[item] < research[id].requires[item]) || (research[id].requires[item] == 0 && player.research[item] > 0)) {
			return true;
		}
	}
	return false;
}
