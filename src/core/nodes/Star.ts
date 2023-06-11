import { Color3 } from '@babylonjs/core/Maths/math.color';
import { CelestialBody } from './CelestialBody';
import type { SerializedCelestialBody } from './CelestialBody';
import type { System } from '../System';

export interface SerializedStar extends SerializedCelestialBody {
	color: number[];
}

export class Star extends CelestialBody {
	color: Color3;
	constructor(id: string, system: System, options) {
		super(id, system, options);
	}

	toJSON(): SerializedStar {
		return Object.assign(super.toJSON(), {
			color: this.color.asArray(),
		});
	}

	static FromJSON(data: SerializedStar, system: System) {
		const star = super.FromJSON(data, system, {}) as Star;
		star.color = Color3.FromArray(data.color) || Color3.Random();
		return star;
	}
}
