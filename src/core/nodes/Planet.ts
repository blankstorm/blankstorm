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

	serialize(): SerializedPlanet {
		return Object.assign(super.serialize(), {
			biome: this.biome,
		});
	}

	static FromData(data: SerializedPlanet, level: Level) {
		const planet = super.FromData(data, level, {}) as Planet;
		planet.biome = data.biome;
		return planet;
	}
}
