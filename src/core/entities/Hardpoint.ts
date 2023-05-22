import { Vector3 } from '@babylonjs/core/Maths/math.vector';

import { wait, xpToLevel } from '../utils';
import { Node } from '../Node';
import type { SerializedNode } from '../Node';
import { LevelEvent } from '../events';
import { genericHardpoints } from '../generic/hardpoints';
import type { HardpointType, GenericHardpoint } from '../generic/hardpoints';
import type { Ship } from './Ship';
import type { Level } from '../Level';
import type { Player } from './Player';
import type { CelestialBody } from '../bodies/CelestialBody';
import type { HardpointInfo } from '../generic/ships';

export interface SerializedHardpoint extends SerializedNode {
	info: HardpointInfo;
	type: HardpointType;
	reload: number;
}

export class Hardpoint extends Node {
	info: HardpointInfo;
	type: HardpointType;
	reload: number;
	declare owner: Ship;
	constructor(id: string, level: Level, { type, reload }: { type: HardpointType; reload?: number }) {
		level;
		super(id, level);

		this.type = type;
		this.reload = reload ?? this.generic.reload;

		this.rotation.addInPlaceFromFloats(0, Math.PI, 0);
	}

	get generic(): GenericHardpoint {
		return Hardpoint.generic[this.type];
	}

	remove() {
		super.remove();
		if (this.owner) {
			this.owner.hardpoints.splice(this.owner.hardpoints.indexOf(this), 1);
		}
	}

	serialize() {
		return Object.assign(super.serialize(), {
			type: this.type,
			info: {
				scale: this.info?.scale || 1,
				position: this.info?.position?.asArray() || [0, 0, 0],
				rotation: this.info?.rotation?.asArray() || [0, 0, 0],
			},
			reload: this.reload,
		});
	}

	/**
	 * @todo implement projectile logic on the core
	 */
	async fire(target: Ship | Hardpoint) {
		// this is so we don't have a circular dependency by importing Ship
		const targetConstructors = [];
		let targetConstructor = target;
		while (targetConstructor) {
			targetConstructor = Object.getPrototypeOf(targetConstructor);
			targetConstructors.push(targetConstructor.name);
		}

		const evt = new LevelEvent('projectile.fire', this.serialize(), { target: target.serialize(), projectile: this.generic.projectile });
		this.level.dispatchEvent(evt);
		const time = Vector3.Distance(this.absolutePosition, target.absolutePosition) / this.generic.projectile.speed;
		this.reload = this.generic.reload;
		await wait(time);
		const targetShip = (targetConstructors.includes('Ship') ? target : target.owner) as Ship;
		targetShip.hp -= this.generic.damage * (Math.random() < this.generic.critChance ? this.generic.critFactor : 1);
		if (targetShip.hp <= 0) {
			const evt = new LevelEvent('entity.death', targetShip.serialize());
			this.level.dispatchEvent(evt);
			let owner;
			switch (this.owner.owner.constructor.name) {
				case 'Player':
					owner = this.owner.owner as Player;
					owner.addItems(targetShip.generic.recipe);
					if (Math.floor(xpToLevel(owner.xp + targetShip.generic.xp)) > Math.floor(xpToLevel(owner.xp))) {
						const evt = new LevelEvent('player.levelup', owner.serialize());
						this.level.dispatchEvent(evt);
						owner.xpPoints++;
					}
					owner.xp += targetShip.generic.xp;
					break;
				case 'CelestialBody':
					owner = this.owner.owner as CelestialBody;
					owner.rewards.addItems(targetShip.generic.recipe);
					break;
				default:
			}
			targetShip.remove();
		}
	}

	static FromData(data: SerializedHardpoint, level: Level): Hardpoint {
		return super.FromData(data, level, data) as Hardpoint;
	}

	static generic = genericHardpoints;
}
