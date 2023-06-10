import { Color3 } from '@babylonjs/core/Maths/math.color';
import { CelestialBody } from './CelestialBody';
import type { SerializedCelestialBody } from './CelestialBody';
import type { Level } from '../Level';

export interface SerializedStar extends SerializedCelestialBody {
	color: number[];
}

export class Star extends CelestialBody {
	color: Color3;
	constructor(id: string, level: Level, options) {
		super(id, level, options);
	}

	serialize(): SerializedStar {
		return Object.assign(super.serialize(), {
			color: this.color.asArray(),
		});
	}

	static FromData(data: SerializedStar, level: Level) {
		const star = super.FromData(data, level, {}) as Star;
		star.color = Color3.FromArray(data.color) || Color3.Random();
		return star;
	}
}
