import { CelestialBody } from './CelestialBody';
import type { SerializedCelestialBody } from './CelestialBody';
import type { System } from '../System';
import type { PlanetBiome } from '../generic/planets';

export interface SerializedPlanet extends SerializedCelestialBody {
	biome: PlanetBiome;
}

export class Planet extends CelestialBody {
	biome: PlanetBiome;
	constructor(id?: string, system?: System, options?: ConstructorParameters<typeof CelestialBody>[2]) {
		super(id, system, options);
	}

	toJSON(): SerializedPlanet {
		return Object.assign(super.toJSON(), {
			biome: this.biome,
		});
	}

	static FromJSON(data: SerializedPlanet, system: System): Planet {
		const planet = <Planet>super.FromJSON(data, system, {});
		planet.biome = data.biome;
		return planet;
	}
}
