import type { Player } from '../nodes/Player';
import { config } from '../metadata';
import type { ItemCollection } from './items';
import type { Producible } from './production';

export interface Research extends Producible {
	xp: number;
	scale: number;
	max: number;
}

const research = {
	armor: { id: 'armor', productionTime: config.tick_rate, recipe: { titanium: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {} },
	laser: { id: 'laser', productionTime: config.tick_rate, recipe: { quartz: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {} },
	reload: { id: 'reload', productionTime: config.tick_rate, recipe: { titanium: 4000, quartz: 1500 }, xp: 1, scale: 1.2, max: 10, requires: {} },
	thrust: { id: 'thrust', productionTime: config.tick_rate, recipe: { hydrogen: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {} },
	energy: { id: 'energy', productionTime: config.tick_rate, recipe: { hydrogen: 5000, quartz: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {} },
	shields: { id: 'shields', productionTime: config.tick_rate, recipe: { titanium: 2500, quartz: 5000 }, xp: 1, scale: 1.5, max: 10, requires: { armor: 5 } },
	storage: { id: 'storage', productionTime: config.tick_rate, recipe: { titanium: 10000, quartz: 10000, hydrogen: 10000 }, xp: 2, scale: 10, max: 25, requires: {} },
	missle: { id: 'missle', productionTime: config.tick_rate, recipe: { titanium: 10000, quartz: 1000, hydrogen: 5000 }, xp: 1, scale: 1.5, max: 25, requires: { laser: 5 } },
	regen: {
		id: 'regen',
		productionTime: config.tick_rate,
		recipe: { titanium: 50000, quartz: 10000, hydrogen: 10000 },
		xp: 1,
		scale: 1.5,
		max: 25,
		requires: { reload: 5, armor: 15 },
	},
	build: { id: 'build', productionTime: config.tick_rate, recipe: { titanium: 100000 }, xp: 2, scale: 1.5, max: 50, requires: { armor: 10, thrust: 10, reload: 10 } },
	salvage: {
		id: 'salvage',
		productionTime: config.tick_rate,
		recipe: { titanium: 250000, quartz: 50000, hydrogen: 100000 },
		xp: 5,
		scale: 1.25,
		max: 25,
		requires: { build: 5 },
	},
} as const;

export type ResearchID = keyof typeof research;
export type ResearchCollection<T = number> = Record<ResearchID, T>;

const _research: ResearchCollection<Research> = research;
export { _research as research };

export function priceOfResearch(id: ResearchID, level: number): Partial<ItemCollection> {
	const recipe = { ...research[id].recipe },
		scale = research[id].scale ** level;
	for (const item in recipe) {
		recipe[item] *= scale;
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
