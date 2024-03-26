import type { Level } from '../level';
import type { PlanetBiome } from '../generic/planets';
import type { SerializedCelestialBody } from './body';
import { CelestialBody } from './body';

export interface SerializedPlanet extends SerializedCelestialBody {
	biome: PlanetBiome;
}

export class Planet extends CelestialBody {
	biome: PlanetBiome;
	constructor(id?: string, level?: Level, options?: ConstructorParameters<typeof CelestialBody>[2]) {
		super(id, level, options);
	}

	toJSON(): SerializedPlanet {
		return Object.assign(super.toJSON(), {
			biome: this.biome,
		});
	}

	static FromJSON(data: SerializedPlanet, level: Level): Planet {
		const planet = <Planet>super.FromJSON(data, level, {});
		planet.biome = data.biome;
		return planet;
	}
}
