import type { ProjectileType } from '../entities/projectile';

export interface GenericHardpoint {
	damage: number;
	/**
	 * Reload time in ticks
	 */
	reload: number;
	range: number;
	critChance: number;
	critFactor: number;
	/**
	 * The different entity types that the hardpoint can target
	 */
	targets: readonly string[];
	activationDistance: number;
	accuracy: number;
	projectileType: ProjectileType;
	projectileCount: number;
	/**
	 * For burst weapons
	 */
	interval: number;
	/**
	 * In m/s
	 */
	projectileSpeed: number;
}

export const genericHardpoints = {
	laser_cannon_double: {
		damage: 1,
		reload: 10,
		range: 200,
		critChance: 0.05,
		critFactor: 1.5,
		targets: ['Ship', 'Station'],
		activationDistance: 1,
		accuracy: 0.5,
		projectileType: 'laser',
		projectileCount: 1,
		interval: 0,
		projectileSpeed: 50,
	},
} as const;

export type HardpointType = keyof typeof genericHardpoints;

genericHardpoints satisfies Record<HardpointType, GenericHardpoint>;
