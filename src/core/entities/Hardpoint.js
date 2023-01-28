import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import { wait } from '../utils.js';
import Node from '../Node.js';
import Ship from './Ship.js';
import Player from './Player.js';

export default class Hardpoint extends Node {
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
			type: this.hardpointType,
			reload: this.reload,
		});
	}

	async fire(target) {
		const time = Vector3.Distance(this.position, target.position) / this._generic.projectile.speed;
		this.reload = this._generic.reload;
		await wait(time);
		const targetShip = target instanceof Ship ? target : target.owner;
		targetShip.hp -= this._generic.damage * (Math.random() < this._generic.critChance ? this._generic.critFactor : 1);
		if (targetShip.hp <= 0) {
			switch (this.owner.owner.constructor.name.toLowerCase()) {
				case 'player':
					this.owner.owner.addItems(targetShip._generic.recipe);
					if (Math.floor(Player.xpToLevel(this.owner.owner.xp + targetShip._generic.xp)) > Math.floor(Player.xpToLevel(this.owner.owner.xp))) {
						/*level up*/
						this.owner.owner.xpPoints++;
					}
					this.owner.owner.xp += targetShip._generic.xp;
					break;
				case 'celestialbody':
					this.owner.owner.rewards.addItems(targetShip._generic.recipe);
					break;
				default:
			}
			targetShip.remove();
		}
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
