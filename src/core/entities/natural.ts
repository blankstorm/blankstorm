import { CopyData } from 'deltablank/core/component.js';
import { EntityWithComponents, registerEntity, type EntityConfig } from 'deltablank/core/entity.js';
import type { InstancesFor } from 'utilium';
import { Color, Container, Fleet, Owner, Waypoint } from '../components';

const planetComponents = [CopyData, Waypoint, Fleet, Container, Owner] as const;

export const planetBiomes = ['earthlike', 'volcanic', 'jungle', 'ice', 'desert', 'moon', 'islands'] as const;

export type PlanetBiome = (typeof planetBiomes)[number];

@registerEntity
export class Planet extends EntityWithComponents(...planetComponents) {
	public biome!: PlanetBiome;
	public seed = Math.random();
	public radius = 1;

	static config = {
		max_items: 1e10,
		fleet: {
			max_ships: 9999,
			allow_nesting: false,
		},
		waypoint: {
			builtin: true,
			readonly: true,
			color: '#88ddff',
			icon: 'earth-americas',
		},
		copy_data: ['biome', 'seed', 'radius'],
	} satisfies EntityConfig<InstancesFor<typeof planetComponents>>;
}

@registerEntity
export class Star extends EntityWithComponents(CopyData, Color, Waypoint) {
	public seed = Math.random();
	public radius = 1;

	static config = {
		waypoint: {
			builtin: true,
			readonly: true,
			color: '#88ddff',
			icon: 'sun-bright',
		},
		copy_data: ['seed', 'radius'],
	} satisfies EntityConfig<[CopyData, Color, Waypoint]>;
}
