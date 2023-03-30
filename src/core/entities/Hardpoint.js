import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import { wait } from '../utils.js';
import Node from '../Node.js';
import Ship from './Ship.js';
import Player from './Player.js';
import { LevelEvent } from '../events.js';

export default class Hardpoint extends Node {
	_generic = {};
	info = {};
	constructor(id, level, { type, reload }) {
		level;
		super(id, level);

		this.hardpointType = type;
		this._generic = Hardpoint.generic.get(type);
		this.reload = reload ?? this._generic.reload;

		this.rotation.addInPlaceFromFloats(0, Math.PI, 0);
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
			info: {
				scale: this.info?.scale,
				position: this.info?.position ? this.info?.position.asArray().map(num => +num.toFixed(3)) : [0, 0, 0],
				rotation: this.info?.rotation ? this.info?.rotation.asArray().map(num => +num.toFixed(3)) : [0, 0, 0],
			},
			reload: this.reload,
		});
	}

	/**
	 * @todo implement projectile logic on the core
	 */
	async fire(target) {
		let evt = new LevelEvent('projectile.fire', this.serialize(), { target: target.serialize(), projectile: this._generic.projectile });
		this.level.dispatchEvent(evt);
		const time = Vector3.Distance(this.absolutePosition, target.absolutePosition) / this._generic.projectile.speed;
		this.reload = this._generic.reload;
		await wait(time);
		const targetShip = target instanceof Ship ? target : target.owner;
		targetShip.hp -= this._generic.damage * (Math.random() < this._generic.critChance ? this._generic.critFactor : 1);
		if (targetShip.hp <= 0) {
			const evt = new LevelEvent('entity.death', targetShip.serialize());
			this.level.dispatchEvent(evt);
			const owner = this.owner.owner;
			switch (owner.constructor.name) {
				case 'Player':
					owner.addItems(targetShip._generic.recipe);
					if (Math.floor(Player.xpToLevel(owner.xp + targetShip._generic.xp)) > Math.floor(Player.xpToLevel(owner.xp))) {
						const evt = new LevelEvent('player.levelup', owner.serialize());
						this.level.dispatchEvent(evt);
						owner.xpPoints++;
					}
					owner.xp += targetShip._generic.xp;
					break;
				case 'CelestialBody':
					owner.rewards.addItems(targetShip._generic.recipe);
					break;
				default:
			}
			targetShip.remove();
		}
	}

	static FromData(data, level) {
		return super.FromData(data, level, data);
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
