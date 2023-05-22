export interface GenericHardpoint {
	damage: number;
	reload: number;
	range: number;
	critChance: number;
	critFactor: number;
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
		projectile: {
			id: 'laser_projectile',
			count: 1,
			interval: 0,
			speed: 5,
		},
	},
};

export type HardpointType = keyof typeof genericHardpoints;

export type GenericHardpointCollection<T = number> = { [key in HardpointType]: T };

const _genericHardpoints: GenericHardpointCollection<GenericHardpoint> = genericHardpoints;
export { _genericHardpoints as genericHardpoints };
