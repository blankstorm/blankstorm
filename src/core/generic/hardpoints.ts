export interface GenericProjectile {
	id: string;
	count: number;
	interval: number;
	speed: number;
}

export interface GenericHardpoint {
	damage: number;
	reload: number;
	range: number;
	critChance: number;
	critFactor: number;

	/**
	 * The different nodeTypes's that the hardpoint can target
	 */
	targets: string[];
	projectile: GenericProjectile;
}

export const genericHardpoints = {
	laser: {
		damage: 1,
		reload: 10,
		range: 200,
		critChance: 0.05,
		critFactor: 1.5,
		targets: ['Ship', 'Station'],
		projectile: {
			id: 'laser_projectile',
			count: 1,
			interval: 0,
			speed: 5,
		},
	},
};

export type HardpointType = keyof typeof genericHardpoints;

genericHardpoints satisfies Record<HardpointType, GenericHardpoint>;
