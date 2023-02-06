import CelestialBody from './CelestialBody.js';

import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

export default class Star extends CelestialBody {
	constructor({ id, name = 'Unknown Star', position, rotation, radius, rewards, fleetPosition, color = Color3.Random(), level }) {
		super({ id, name, position, rotation, radius, rewards, fleetPosition, level });
		this.color = color;
	}

	serialize() {
		return Object.assign(super.serialize(), {
			color: this.color.asArray().map(e => +e.toFixed(3)),
			radius: this.radius,
		});
	}

	static FromData(data, level) {
		const owner = level.getNodeByID(data.owner);
		return new this({
			id: data.id,
			name: data.name,
			radius: data.radius,
			rewards: data.rewards,
			position: Vector3.FromArray(data.position || [0, 0, 0]),
			rotation: Vector3.FromArray(data.rotation || [0, 0, 0]),
			fleetPosition: Vector3.FromArray(data.fleetPosition || [0, 0, 0]),
			color: Color3.FromArray(data.color || [0, 0, 0]),
			owner,
			level,
		});
	}
}
