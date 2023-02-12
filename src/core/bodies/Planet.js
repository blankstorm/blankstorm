import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import CelestialBody from './CelestialBody.js';

export default class Planet extends CelestialBody {
	constructor({ id, name, position, rotation, biome = 'earthlike', radius, owner, fleet, fleetPosition, rewards, level }) {
		super({ id, name: name ?? 'Unknown Planet', position, rotation, owner, radius, fleet, fleetPosition, rewards, level });
		this.biome = biome;
	}

	serialize() {
		return Object.assign(super.serialize(), {
			biome: this.biome,
		});
	}

	static FromData(data, level) {
		const owner = level.getNodeByID(data.owner);
		return new this({
			id: data.id,
			name: data.name,
			biome: data.biome,
			radius: data.radius,
			rewards: data.rewards,
			position: Vector3.FromArray(data.position || [0, 0, 0]),
			rotation: Vector3.FromArray(data.rotation || [0, 0, 0]),
			fleetPosition: Vector3.FromArray(data.fleetPosition || [0, 0, 0]),
			owner,
			level,
		});
	}
}
