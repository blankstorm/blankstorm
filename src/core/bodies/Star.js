import CelestialBody from './CelestialBody.js';

import { Color3 } from '@babylonjs/core/Maths/math.color.js';

export default class Star extends CelestialBody {
	constructor(id, level, options) {
		super(id, level, options);
	}

	serialize() {
		return Object.assign(super.serialize(), {
			color: this.color.asArray().map(e => +e.toFixed(3)),
		});
	}

	static FromData(data, level) {
		const star = super.FromData(data, level);
		star.color = Color3.FromArray(data.color) || Color3.Random();
		return star;
	}
}
