import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Level } from '../Level';
import type { SerializedCelestialBody } from './CelestialBody';
import { CelestialBody } from './CelestialBody';

export interface SerializedStar extends SerializedCelestialBody {
	color: number[];
}

export class Star extends CelestialBody {
	color: Color3;
	constructor(id: string, level: Level, options) {
		super(id, level, options);
	}

	toJSON(): SerializedStar {
		return Object.assign(super.toJSON(), {
			color: this.color.asArray(),
		});
	}

	static FromJSON(data: SerializedStar, level: Level): Star {
		const star = <Star>super.FromJSON(data, level, {});
		star.color = Color3.FromArray(data.color) || Color3.Random();
		return star;
	}
}
