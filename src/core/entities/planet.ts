import { assignWithDefaults, pick } from 'utilium';
import type { PlanetBiome } from '../generic/planets.js';
import type { CelestialBodyJSON } from './body.js';
import { CelestialBody } from './body.js';

export interface PlanetData extends CelestialBodyJSON {
	biome: PlanetBiome;
}

export class Planet extends CelestialBody {
	public biome!: PlanetBiome;

	public toJSON(): PlanetData {
		return {
			...super.toJSON(),
			...pick(this, 'biome'),
		};
	}

	public fromJSON(data: PlanetData): void {
		super.fromJSON(data);
		assignWithDefaults(this as Planet, pick(data, 'biome'));
	}
}
