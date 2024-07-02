import { assignWithDefaults, pick } from 'utilium';
import type { PlanetBiome } from '../generic/planets';
import type { CelestialBodyJSON } from './body';
import { CelestialBody } from './body';

export interface PlanetData extends CelestialBodyJSON {
	biome: PlanetBiome;
}

export class Planet extends CelestialBody {
	public biome: PlanetBiome;

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
