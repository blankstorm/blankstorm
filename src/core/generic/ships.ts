import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Producible, computeProductionDifficulty } from './items';
import { genericHardpoints } from './hardpoints';

export interface HardpointInfo {
	type: string;
	position: Vector3;
	rotation?: Vector3;
	scale: number;
}

export interface SerializedHardpointInfo {
	type: string;
	position: number[];
	rotation?: number[];
	scale: number;
}

export interface GenericShip extends Producible {
	hp: number;
	speed: number;
	agility: number;
	jumpRange: number;
	jumpCooldown: number;
	power: number;
	enemy: boolean;
	camRadius: number;
	xp: number;
	storage: number;
	hardpoints: HardpointInfo[];
}

const genericShips = {
	wind: {
		id: 'wind',
		hp: 10,
		speed: 2,
		agility: 2,
		jumpRange: 10000,
		jumpCooldown: 300,
		power: 1,
		enemy: true,
		camRadius: 10,
		xp: 5,
		storage: 100,
		recipe: { titanium: 1000, quartz: 500, hydrogen: 250 },
		requires: {},
		hardpoints: [{ type: 'laser', position: new Vector3(0, 0.01, 0.05), scale: 0.25 }],
	},

	mosquito: {
		id: 'mosquito',
		hp: 25,
		speed: 1,
		agility: 1.5,
		jumpRange: 10000,
		jumpCooldown: 400,
		power: 2,
		enemy: true,
		camRadius: 15,
		xp: 7.5,
		storage: 250,
		recipe: { titanium: 2000, quartz: 2000, hydrogen: 500 },
		requires: {},
		hardpoints: [
			{ type: 'laser', position: new Vector3(-0.025, 0.0075, -0.075), scale: 0.375 },
			{ type: 'laser', position: new Vector3(0.025, 0.0075, -0.075), scale: 0.375 },
		],
	},
	cillus: {
		id: 'cillus',
		hp: 5,
		speed: 1,
		agility: 0.75,
		jumpRange: 10000,
		jumpCooldown: 500,
		power: 1,
		enemy: false,
		camRadius: 20,
		xp: 10,
		storage: 25000,
		recipe: { titanium: 5000, quartz: 1000, hydrogen: 2500 },
		requires: { storage: 3 },
		hardpoints: [],
	},
	inca: {
		id: 'inca',
		hp: 50,
		speed: 1,
		agility: 1,
		jumpRange: 10000,
		jumpCooldown: 450,
		power: 5,
		enemy: true,
		camRadius: 20,
		xp: 10,
		storage: 250,
		recipe: { titanium: 4000, quartz: 1000, hydrogen: 1000 },
		requires: {},
		hardpoints: [
			{ type: 'laser', position: new Vector3(-0.06, 0.03, -0.1), scale: 0.75 },
			{ type: 'laser', position: new Vector3(0.06, 0.03, -0.1), scale: 0.75 },
			{ type: 'laser', position: new Vector3(0.06, 0.015, 0.05), scale: 0.75 },
			{ type: 'laser', position: new Vector3(-0.06, 0.015, 0.05), scale: 0.75 },
		],
	},
	pilsung: {
		id: 'pilsung',
		hp: 100,
		speed: 1,
		agility: 1,
		jumpRange: 10000,
		jumpCooldown: 450,
		power: 10,
		enemy: true,
		camRadius: 30,
		xp: 20,
		storage: 1000,
		recipe: { titanium: 10000, quartz: 4000, hydrogen: 2500 },
		requires: {},
		hardpoints: [
			{ type: 'laser', position: new Vector3(0.1, 0.04, -0.1), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.8 },
			{ type: 'laser', position: new Vector3(0.1, 0.04, -0.05), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.8 },
			{ type: 'laser', position: new Vector3(0.1, 0.04, 0), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.8 },
			{ type: 'laser', position: new Vector3(0.1, 0.04, 0.05), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.8 },
			{ type: 'laser', position: new Vector3(-0.1, 0.04, -0.1), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.8 },
			{ type: 'laser', position: new Vector3(-0.1, 0.04, -0.05), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.8 },
			{ type: 'laser', position: new Vector3(-0.1, 0.04, 0), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.8 },
			{ type: 'laser', position: new Vector3(-0.1, 0.04, 0.05), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.8 },
		],
	},
	apis: {
		id: 'apis',
		hp: 50,
		speed: 2 / 3,
		agility: 0.5,
		jumpRange: 10000,
		jumpCooldown: 600,
		power: 10,
		enemy: false,
		camRadius: 50,
		xp: 10,
		storage: 100000,
		recipe: { titanium: 10000, quartz: 2000, hydrogen: 5000 },
		requires: { storage: 5 },
		hardpoints: [],
	},
	hurricane: {
		id: 'hurricane',
		hp: 250,
		speed: 2 / 3,
		agility: 1,
		jumpRange: 10000,
		jumpCooldown: 450,
		power: 25,
		enemy: true,
		camRadius: 40,
		xp: 50,
		storage: 2500,
		recipe: { titanium: 25000, quartz: 10000, hydrogen: 5000 },
		requires: {},
		hardpoints: [
			{ type: 'laser', position: new Vector3(0.325, 0.0375, -1.225), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.85 },
			{ type: 'laser', position: new Vector3(0.325, 0.0375, -1.15), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.85 },
			{ type: 'laser', position: new Vector3(0.325, 0.0375, -1.075), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.85 },
			{ type: 'laser', position: new Vector3(-0.325, 0.0375, -1.225), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.85 },
			{ type: 'laser', position: new Vector3(-0.325, 0.0375, -1.15), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.85 },
			{ type: 'laser', position: new Vector3(-0.325, 0.0375, -1.075), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.85 },
			{ type: 'laser', position: new Vector3(0.1, 0.03, -0.35), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.75 },
			{ type: 'laser', position: new Vector3(0.1, 0.03, -0.2875), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.75 },
			{ type: 'laser', position: new Vector3(0.1, 0.03, -0.225), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.75 },
			{ type: 'laser', position: new Vector3(0.1, 0.03, -0.1625), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.75 },
			{ type: 'laser', position: new Vector3(-0.1, 0.03, -0.35), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.75 },
			{ type: 'laser', position: new Vector3(-0.1, 0.03, -0.2875), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.75 },
			{ type: 'laser', position: new Vector3(-0.1, 0.03, -0.225), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.75 },
			{ type: 'laser', position: new Vector3(-0.1, 0.03, -0.1625), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.75 },
		],
	},
	horizon: {
		id: 'horizon',
		hp: 2000,
		speed: 1 / 3,
		agility: 1,
		jumpRange: 10000,
		jumpCooldown: 600,
		power: 100,
		enemy: true,
		camRadius: 65,
		xp: 100,
		storage: 10000,
		recipe: { titanium: 1000000, quartz: 500000, hydrogen: 250000 },
		requires: { build: 5 },
		hardpoints: [
			{ type: 'laser', position: new Vector3(2.125, 0.055, -0.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(2, 0.055, 0), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(1.875, 0.055, 0.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(1.75, 0.055, 1), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(1.625, 0.055, 1.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(1.5, 0.055, 2), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(1.375, 0.055, 2.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(1.25, 0.055, 3), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(1.125, 0.055, 3.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(1, 0.055, 4), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(0.875, 0.055, 4.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(0.75, 0.055, 5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(0.625, 0.055, 5.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(0.5, 0.055, 6), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(0.375, 0.055, 6.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(0.25, 0.055, 7), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },

			{ type: 'laser', position: new Vector3(-2.125, 0.055, -0.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(-2, 0.055, 0), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(-1.875, 0.055, 0.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(-1.75, 0.055, 1), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(-1.625, 0.055, 1.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(-1.5, 0.055, 2), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(-1.375, 0.055, 2.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(-1.25, 0.055, 3), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(-1.125, 0.055, 3.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(-1, 0.055, 4), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(-0.875, 0.055, 4.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(-0.75, 0.055, 5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(-0.625, 0.055, 5.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(-0.5, 0.055, 6), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(-0.375, 0.055, 6.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
			{ type: 'laser', position: new Vector3(-0.25, 0.055, 7), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
		],
	},
};

export type ShipType = keyof typeof genericShips;

export type GenericShipCollection<T = number> = { [key in ShipType]: T };

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

	const movement = ship.speed + ship.agility + Math.log10(ship.jumpRange) / Math.log10(ship.jumpCooldown);

	const support = Math.log10(ship.storage);

	const production = computeProductionDifficulty(ship);

	return { combat, movement, support, production };
}
