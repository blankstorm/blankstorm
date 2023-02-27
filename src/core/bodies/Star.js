import CelestialBody from './CelestialBody.js';

import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

export default class Star extends CelestialBody {
	constructor(id, level, options) {
		super(id, level, options);
	}

	serialize() {
		return Object.assign(super.serialize(), {
			color: this.color.asArray().map(e => +e.toFixed(3)),
			radius: this.radius,
		});
	}

	static FromData(data, level, constructorOptions) {
		const star = super.FromData(data, level, constructorOptions);
		star.color = Color3.FromArray(data.color) || Color3.Random();
		return star;
	}
}
