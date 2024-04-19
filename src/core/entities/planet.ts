import type { PlanetBiome } from '../generic/planets';
import type { Level } from '../level';
import type { CelestialBodyJSON } from './body';
import { CelestialBody } from './body';

export interface PlanetData extends CelestialBodyJSON {
	biome: PlanetBiome;
}

export class Planet extends CelestialBody {
	public biome: PlanetBiome;
	public constructor(id?: string, level?: Level, options?: ConstructorParameters<typeof CelestialBody>[2]) {
		super(id, level, options);
	}

	public toJSON(): PlanetData {
		return {
			...super.toJSON(),
			biome: this.biome,
		};
	}

	public fromJSON(data: PlanetData, level: Level): void {
		super.fromJSON(data, level);
		this.biome = data.biome;
	}
}
