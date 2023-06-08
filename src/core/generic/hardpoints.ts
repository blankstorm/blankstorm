export interface GenericHardpoint {
	damage: number;
	reload: number;
	range: number;
	critChance: number;
	critFactor: number;

	/**
	 * The different node_types's that the hardpoint can target
	 */
	targets: string[];
	projectile: {
		id: string;
		count: number;
		interval: number;
		speed: number;
	};
}

const genericHardpoints = {
	laser: {
		damage: 1,
		reload: 10,
		range: 200,
		critChance: 0.05,
		critFactor: 1.5,
		targets: [ 'ship', 'station' ],
		projectile: {
			id: 'laser_projectile',
			count: 1,
			interval: 0,
			speed: 5,
		},
	},
};

export type HardpointType = keyof typeof genericHardpoints;

export type GenericHardpointCollection<T = number> = Record<HardpointType, T>;

const _genericHardpoints: GenericHardpointCollection<GenericHardpoint> = genericHardpoints;
export { _genericHardpoints as genericHardpoints };
