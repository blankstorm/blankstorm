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
	armor: { recipe: { titanium: 1000, quartz: 0, hydrogen: 0, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.5, max: 25, requires: {} },
	laser: { recipe: { titanium: 0, quartz: 1000, hydrogen: 0, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.5, max: 25, requires: {} },
	reload: { recipe: { titanium: 4000, quartz: 1500, hydrogen: 0, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.2, max: 10, requires: {} },
	thrust: { recipe: { titanium: 0, quartz: 0, hydrogen: 1000, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.5, max: 25, requires: {} },
	energy: { recipe: { titanium: 0, hydrogen: 5000, quartz: 1000, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.5, max: 25, requires: {} },
	shields: { recipe: { titanium: 2500, quartz: 5000, hydrogen: 0, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.5, max: 10, requires: { armor: 5 } },
	storage: { recipe: { titanium: 10000, quartz: 10000, hydrogen: 10000, ancient_tech: 0, code_snippets: 0 }, xp: 2, scale: 10, max: 25, requires: {} },
	missle: { recipe: { titanium: 10000, quartz: 1000, hydrogen: 5000, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.5, max: 25, requires: { laser: 5 } },
	regen: { recipe: { titanium: 50000, quartz: 10000, hydrogen: 10000, ancient_tech: 0, code_snippets: 0 }, xp: 1, scale: 1.5, max: 25, requires: { reload: 5, armor: 15 } },
	build: { recipe: { titanium: 100000, quartz: 0, hydrogen: 0, ancient_tech: 0, code_snippets: 0 }, xp: 2, scale: 1.5, max: 50, requires: { armor: 10, thrust: 10, reload: 10 } },
	salvage: { recipe: { titanium: 250000, quartz: 50000, hydrogen: 100000, ancient_tech: 0, code_snippets: 0 }, xp: 5, scale: 1.25, max: 25, requires: { build: 5 } },
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
