import { CelestialBody } from './CelestialBody';
import type { SerializedCelestialBody } from './CelestialBody';
import type { Level } from '../Level';

export interface SerializedPlanet extends SerializedCelestialBody {
	biome: string;
}

export class Planet extends CelestialBody {
	biome: string;
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
