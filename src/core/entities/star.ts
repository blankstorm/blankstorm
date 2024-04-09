import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Level } from '../level';
import type { CelestialBodyJSON } from './body';
import { CelestialBody } from './body';

export interface StarJSON extends CelestialBodyJSON {
	color: number[];
}

export class Star extends CelestialBody {
	color: Color3;
	constructor(id: string, level: Level, options) {
		super(id, level, options);
	}

	toJSON(): StarJSON {
		return Object.assign(super.toJSON(), {
			color: this.color.asArray(),
		});
	}

	static FromJSON(data: StarJSON, level: Level): Star {
		const star = <Star>super.FromJSON(data, level, {});
		star.color = Color3.FromArray(data.color) || Color3.Random();
		return star;
	}
}
