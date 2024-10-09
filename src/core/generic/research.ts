import type { Player } from '../entities/player.js';
import { config } from '../metadata.js';
import type { Product } from './production.js';
import type { ItemID } from './items.js';
import type { Entries } from 'utilium';

export interface Research extends Product {
	xp: number;
	scale: number;
	max: number;
	id: ResearchID;
}

const _research = {
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

export type ResearchID = keyof typeof _research;

export const research = new Map<ResearchID, Research>(Object.entries(_research) as Entries<typeof _research>);

export function priceOfResearch(id: ResearchID, level: number): Partial<Record<ItemID, number>> {
	const _ = research.get(id)!,
		recipe = { ..._.recipe },
		scale = _.scale ** level;

	for (const id of Object.keys(recipe) as ItemID[]) {
		if (recipe[id]) {
			recipe[id] *= scale;
		}
	}

	return recipe;
}
export function isResearchLocked(id: ResearchID, player: Player): boolean {
	const requires = research.get(id)!.requires;
	for (const item of research.keys()) {
		const needed = requires[item] || 0;
		if ((needed > 0 && player.research[item] < needed) || (needed == 0 && player.research[item] > 0)) {
			return true;
		}
	}
	return false;
}
