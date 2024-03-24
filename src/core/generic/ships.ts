import type { IVector3Like } from '@babylonjs/core/Maths/math.like';
import { config } from '../metadata';
import { genericHardpoints } from './hardpoints';
import type { Producible } from './production';
import { computeProductionDifficulty } from './production';

export interface HardpointInfo {
	type: string;
	position: IVector3Like;
	rotation?: IVector3Like;
	scale: number;
}

export interface GenericShip extends Producible {
	hp: number;
	speed: number;
	agility: number;
	jump: {
		range: number;
		cooldown: number;
	};
	power: number;
	enemy: boolean;
	camRadius: number;
	xp: number;
	storage: number;
	hardpoints: HardpointInfo[] | Readonly<HardpointInfo[]>;
}

const genericShips = {
	wind: {
		id: 'wind',
		hp: 10,
		speed: 2,
		agility: 2,
		jump: {
			range: 10000,
			cooldown: 30 * config.tick_rate,
		},
		power: 1,
		enemy: true,
		camRadius: 10,
		xp: 5,
		storage: 100,
		recipe: { titanium: 1000, quartz: 500, hydrogen: 250 },
		requires: {},
		productionTime: 60 * config.tick_rate,
		hardpoints: [{ type: 'laser', position: { x: 0, y: 0.01, z: 0.05 }, scale: 0.25 }],
	},

	mosquito: {
		id: 'mosquito',
		hp: 25,
		speed: 1,
		agility: 1.5,
		jump: {
			range: 10000,
			cooldown: 40 * config.tick_rate,
		},
		power: 2,
		enemy: true,
		camRadius: 15,
		xp: 7.5,
		storage: 250,
		recipe: { titanium: 2000, quartz: 2000, hydrogen: 500 },
		requires: {},
		productionTime: 5 * 60 * config.tick_rate,
		hardpoints: [
			{ type: 'laser', position: { x: -0.025, y: 0.0075, z: -0.075 }, scale: 0.375 },
			{ type: 'laser', position: { x: 0.025, y: 0.0075, z: -0.075 }, scale: 0.375 },
		],
	},
	cillus: {
		id: 'cillus',
		hp: 5,
		speed: 1,
		agility: 0.75,
		jump: {
			range: 10000,
			cooldown: 50 * config.tick_rate,
		},
		power: 1,
		enemy: false,
		camRadius: 20,
		xp: 10,
		storage: 25000,
		recipe: { titanium: 5000, quartz: 1000, hydrogen: 2500 },
		requires: { storage: 3 },
		productionTime: 10 * 60 * config.tick_rate,
		hardpoints: [],
	},
	inca: {
		id: 'inca',
		hp: 50,
		speed: 1,
		agility: 1,
		jump: {
			range: 10000,
			cooldown: 45 * config.tick_rate,
		},
		power: 5,
		enemy: true,
		camRadius: 20,
		xp: 10,
		storage: 250,
		recipe: { titanium: 4000, quartz: 1000, hydrogen: 1000 },
		requires: {},
		productionTime: 10 * 60 * config.tick_rate,
		hardpoints: [
			{ type: 'laser', position: { x: -0.06, y: 0.03, z: -0.1 }, scale: 0.75 },
			{ type: 'laser', position: { x: 0.06, y: 0.03, z: -0.1 }, scale: 0.75 },
			{ type: 'laser', position: { x: 0.06, y: 0.015, z: 0.05 }, scale: 0.75 },
			{ type: 'laser', position: { x: -0.06, y: 0.015, z: 0.05 }, scale: 0.75 },
		],
	},
	pilsung: {
		id: 'pilsung',
		hp: 100,
		speed: 1,
		agility: 1,
		jump: {
			range: 10000,
			cooldown: 45 * config.tick_rate,
		},
		power: 10,
		enemy: true,
		camRadius: 30,
		xp: 20,
		storage: 1000,
		recipe: { titanium: 10000, quartz: 4000, hydrogen: 2500 },
		requires: {},
		productionTime: 12.5 * 60 * config.tick_rate,
		hardpoints: [
			{ type: 'laser', position: { x: 0.1, y: 0.04, z: -0.1 }, rotation: { x: 0, y: Math.PI / 2, z: 0 }, scale: 0.8 },
			{ type: 'laser', position: { x: 0.1, y: 0.04, z: -0.05 }, rotation: { x: 0, y: Math.PI / 2, z: 0 }, scale: 0.8 },
			{ type: 'laser', position: { x: 0.1, y: 0.04, z: 0 }, rotation: { x: 0, y: Math.PI / 2, z: 0 }, scale: 0.8 },
			{ type: 'laser', position: { x: 0.1, y: 0.04, z: 0.05 }, rotation: { x: 0, y: Math.PI / 2, z: 0 }, scale: 0.8 },
			{ type: 'laser', position: { x: -0.1, y: 0.04, z: -0.1 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 }, scale: 0.8 },
			{ type: 'laser', position: { x: -0.1, y: 0.04, z: -0.05 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 }, scale: 0.8 },
			{ type: 'laser', position: { x: -0.1, y: 0.04, z: 0 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 }, scale: 0.8 },
			{ type: 'laser', position: { x: -0.1, y: 0.04, z: 0.05 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 }, scale: 0.8 },
		],
	},
	apis: {
		id: 'apis',
		hp: 50,
		speed: 2 / 3,
		agility: 0.5,
		jump: {
			range: 10000,
			cooldown: 60 * config.tick_rate,
		},
		power: 10,
		enemy: false,
		camRadius: 50,
		xp: 10,
		storage: 100000,
		recipe: { titanium: 10000, quartz: 2000, hydrogen: 5000 },
		requires: { storage: 5 },
		productionTime: 20 * 60 * config.tick_rate,
		hardpoints: [],
	},
	hurricane: {
		id: 'hurricane',
		hp: 250,
		speed: 2 / 3,
		agility: 1,
		jump: {
			range: 10000,
			cooldown: 45 * config.tick_rate,
		},
		power: 25,
		enemy: true,
		camRadius: 40,
		xp: 50,
		storage: 2500,
		recipe: { titanium: 25000, quartz: 10000, hydrogen: 5000 },
		requires: {},
		productionTime: 15 * 60 * config.tick_rate,
		hardpoints: [
			{ type: 'laser', position: { x: 0.325, y: 0.0375, z: -1.225 }, rotation: { x: 0, y: Math.PI / 2, z: 0 }, scale: 0.85 },
			{ type: 'laser', position: { x: 0.325, y: 0.0375, z: -1.15 }, rotation: { x: 0, y: Math.PI / 2, z: 0 }, scale: 0.85 },
			{ type: 'laser', position: { x: 0.325, y: 0.0375, z: -1.075 }, rotation: { x: 0, y: Math.PI / 2, z: 0 }, scale: 0.85 },
			{ type: 'laser', position: { x: -0.325, y: 0.0375, z: -1.225 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 }, scale: 0.85 },
			{ type: 'laser', position: { x: -0.325, y: 0.0375, z: -1.15 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 }, scale: 0.85 },
			{ type: 'laser', position: { x: -0.325, y: 0.0375, z: -1.075 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 }, scale: 0.85 },
			{ type: 'laser', position: { x: 0.1, y: 0.03, z: -0.35 }, rotation: { x: 0, y: Math.PI / 2, z: 0 }, scale: 0.75 },
			{ type: 'laser', position: { x: 0.1, y: 0.03, z: -0.2875 }, rotation: { x: 0, y: Math.PI / 2, z: 0 }, scale: 0.75 },
			{ type: 'laser', position: { x: 0.1, y: 0.03, z: -0.225 }, rotation: { x: 0, y: Math.PI / 2, z: 0 }, scale: 0.75 },
			{ type: 'laser', position: { x: 0.1, y: 0.03, z: -0.1625 }, rotation: { x: 0, y: Math.PI / 2, z: 0 }, scale: 0.75 },
			{ type: 'laser', position: { x: -0.1, y: 0.03, z: -0.35 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 }, scale: 0.75 },
			{ type: 'laser', position: { x: -0.1, y: 0.03, z: -0.2875 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 }, scale: 0.75 },
			{ type: 'laser', position: { x: -0.1, y: 0.03, z: -0.225 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 }, scale: 0.75 },
			{ type: 'laser', position: { x: -0.1, y: 0.03, z: -0.1625 }, rotation: { x: 0, y: -Math.PI / 2, z: 0 }, scale: 0.75 },
		],
	},
	horizon: {
		id: 'horizon',
		hp: 2000,
		speed: 1 / 3,
		agility: 1,
		jump: {
			range: 10000,
			cooldown: 60 * config.tick_rate,
		},
		power: 100,
		enemy: true,
		camRadius: 65,
		xp: 100,
		storage: 10000,
		recipe: { titanium: 1000000, quartz: 500000, hydrogen: 250000 },
		requires: { build: 5 },
		productionTime: 30 * 60 * config.tick_rate,
		hardpoints: [
			{ type: 'laser', position: { x: 2.125, y: 0.055, z: -0.5 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: 2, y: 0.055, z: 0 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: 1.875, y: 0.055, z: 0.5 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: 1.75, y: 0.055, z: 1 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: 1.625, y: 0.055, z: 1.5 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: 1.5, y: 0.055, z: 2 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: 1.375, y: 0.055, z: 2.5 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: 1.25, y: 0.055, z: 3 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: 1.125, y: 0.055, z: 3.5 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: 1, y: 0.055, z: 4 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: 0.875, y: 0.055, z: 4.5 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: 0.75, y: 0.055, z: 5 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: 0.625, y: 0.055, z: 5.5 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: 0.5, y: 0.055, z: 6 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: 0.375, y: 0.055, z: 6.5 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: 0.25, y: 0.055, z: 7 }, rotation: { x: 0, y: (Math.PI * 5) / 12, z: 0 }, scale: 1.5 },

			{ type: 'laser', position: { x: -2.125, y: 0.055, z: -0.5 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: -2, y: 0.055, z: 0 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: -1.875, y: 0.055, z: 0.5 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: -1.75, y: 0.055, z: 1 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: -1.625, y: 0.055, z: 1.5 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: -1.5, y: 0.055, z: 2 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: -1.375, y: 0.055, z: 2.5 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: -1.25, y: 0.055, z: 3 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: -1.125, y: 0.055, z: 3.5 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: -1, y: 0.055, z: 4 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: -0.875, y: 0.055, z: 4.5 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: -0.75, y: 0.055, z: 5 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: -0.625, y: 0.055, z: 5.5 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: -0.5, y: 0.055, z: 6 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: -0.375, y: 0.055, z: 6.5 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
			{ type: 'laser', position: { x: -0.25, y: 0.055, z: 7 }, rotation: { x: 0, y: (-Math.PI * 5) / 12, z: 0 }, scale: 1.5 },
		],
	},
} as const;

export type ShipType = keyof typeof genericShips;

export const shipTypes = Object.keys(genericShips) as ShipType[];

export type GenericShipCollection<T = number> = Record<ShipType, T>;

const _ships: GenericShipCollection<GenericShip> = genericShips;
export { _ships as genericShips };

export interface ShipRatings {
	combat: number;
	movement: number;
	support: number;
	production: number;
}

export function computeRatings(ship: GenericShip): ShipRatings {
	let combat = Math.log10(ship.hp);
	for (const info of ship.hardpoints) {
		const hardpoint = genericHardpoints[info.type];
		const hardpointpRating = hardpoint.damage / hardpoint.reload + hardpoint.critChance * hardpoint.critFactor;
		combat += hardpointpRating;
	}

	const movement = ship.speed + ship.agility + Math.log10(ship.jump.range) / Math.log10(ship.jump.cooldown);

	const support = Math.log10(ship.storage);

	const production = computeProductionDifficulty(ship);

	return { combat, movement, support, production };
}
