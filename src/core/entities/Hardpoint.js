import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import { wait } from '../utils.js';
import Entity from './Entity.js';
import Ship from './Ship.js';

export default class Hardpoint extends Entity {
	_generic = {};
	constructor({ id, name, position, rotation, owner, level, type }) {
		level ?? owner?.level;
		super({ id, name, position, rotation, owner, level });

		this.hardpointType = type;
		this._generic = Hardpoint.generic.get(type);

		this.rotation.addInPlaceFromFloats(0, Math.PI, 0);
		this.reload = this._generic.reload;
	}

	remove() {
		super.remove();
		if (this.owner) {
			this.owner.hardpoints.splice(this.owner.hardpoints.indexOf(this), 1);
		}
	}

	serialize() {
		return Object.assign(super.serialize(), {
			hardpoint_type: this.hardpointType,
			reload: this.reload,
		});
	}

	async fire(target) {
		const time = Vector3.Distance(this.position, target.position) / this._generic.projectile.speed;
		this.reload = this._generic.reload;
		await wait(time);
		(target instanceof Ship ? target : target.owner).hp -= this._generic.damage * (Math.random() < this._generic.critChance ? this._generic.critFactor : 1);
	}

	static generic = new Map(
		Object.entries({
			laser: {
				damage: 1,
				reload: 10,
				range: 200,
				critChance: 0.05,
				critFactor: 1.5,
				projectile: {
					id: 'laser_projectile',
					count: 1,
					interval: 0,
					speed: 5,
				},
			},
		})
	);
}
