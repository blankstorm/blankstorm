import { Color3 } from '@babylonjs/core/Maths/math.color';
import { type Tuple } from 'utilium';
import type { PlanetBiome } from '../generic/planets';
import { CelestialBody, type CelestialBodyJSON } from './body';

type Kind = 'star' | 'planet';

export interface StarJSON extends CelestialBodyJSON {
	kind: 'star';
	biome: Tuple<number, 3>;
}

export interface PlanetJSON extends CelestialBodyJSON {
	kind: 'planet';
	biome: PlanetBiome;
}

type Data<K extends Kind | null = null> = K extends 'star' ? StarJSON : K extends 'planet' ? PlanetJSON : StarJSON | PlanetJSON;

export { Data as NaturalBodyJSON, Kind as NaturalBodyKind };

export class NaturalBody<K extends Kind> extends CelestialBody {
	public kind: K;

	biome: K extends 'planet' ? PlanetBiome : Color3;

	public toJSON(): StarJSON | PlanetJSON {
		const base = {
			...super.toJSON(),
			kind: this.kind,
		};
		switch (this.kind) {
			case 'star':
				return { ...base, biome: this.biome.asArray() };
			case 'planet':
				return { ...base, biome: this.biome };
			default:
				throw new Error();
		}
	}

	public fromJSON(data: Partial<Data<K>>): void {
		super.fromJSON(data);
		if (this.kind != data.kind) {
			throw new Error();
		}
		switch (this.kind) {
			case 'star':
				this.biome = Color3.FromArray((data as Partial<Data<'star'>>).biome || this.biome?.asArray());
				break;
			case 'planet':
				this.biome = data.biome;
				break;
		}
	}
}
