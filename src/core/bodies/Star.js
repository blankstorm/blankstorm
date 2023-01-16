import CelestialBody from './CelestialBody.js';

import { Color3 } from '@babylonjs/core/Maths/math.color.js';

export default class Star extends CelestialBody {
	constructor({ id, name = 'Unknown Star', position, rotation, radius, rewards, color = Color3.Random(), level }) {
		super(id, { name, position, rotation, radius, rewards }, level);
		this.color = color;
	}

	serialize(){
		return Object.assign(super.serialize(), {
			color: this.color.asArray().map(e => e.toFixed(3)),
			radius: this.radius,
		});
	}
}
