import { CelestialBody } from './CelestialBody';
import type { SerializedCelestialBody } from './CelestialBody';
import type { Level } from '../Level';
import type { PlanetBiome } from '../generic/planets';

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

	static FromJSON(data: SerializedPlanet, level: Level) {
		const planet = super.FromJSON(data, level, {}) as Planet;
		planet.biome = data.biome;
		return planet;
	}
}
