import { Vector3 } from '@babylonjs/core/Maths/math.vector';

import { resolveConstructors, wait, xpToLevel } from '../utils';
import { Entity } from './Entity';
import type { SerializedEntity } from './Entity';
import { genericHardpoints } from '../generic/hardpoints';
import type { HardpointType, GenericHardpoint } from '../generic/hardpoints';
import type { Ship } from './Ship';
import type { System } from '../System';
import type { Player } from './Player';
import type { CelestialBody } from './CelestialBody';
import type { HardpointInfo, SerializedHardpointInfo } from '../generic/ships';

export interface SerializedHardpoint extends SerializedEntity {
	info: SerializedHardpointInfo;
	type: HardpointType;
	reload: number;
}

export class Hardpoint extends Entity {
	info: HardpointInfo;
	type: HardpointType;
	reload: number;
	declare owner: Ship;
	constructor(id: string, system: System, { type, reload }: { type?: HardpointType; reload?: number } = {}) {
		super(id, system);

		this.type = type;
		this.reload = reload ?? this.generic.reload;

		this.rotation.addInPlaceFromFloats(0, Math.PI, 0);
	}

	get generic(): GenericHardpoint {
		return genericHardpoints[this.type];
	}

	remove() {
		super.remove();
		if (this.owner) {
			this.owner.hardpoints.splice(this.owner.hardpoints.indexOf(this), 1);
		}
	}

	toJSON(): SerializedHardpoint {
		return Object.assign(super.toJSON(), {
			type: this.type,
			info: {
				type: this.info?.type,
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
		const targetConstructors = resolveConstructors(target);

		this.system.emit('projectile.fire', this.id, target.id, this.generic.projectile);
		const time = Vector3.Distance(this.absolutePosition, target.absolutePosition) / this.generic.projectile.speed;
		this.reload = this.generic.reload;
		await wait(time);
		const targetShip = (targetConstructors.includes('Ship') ? target : target.owner) as Ship;
		targetShip.hp -= this.generic.damage * (Math.random() < this.generic.critChance ? this.generic.critFactor : 1);
		if (targetShip.hp <= 0) {
			this.system.emit('entity.death', targetShip.toJSON());
			let owner;
			switch (this.owner.owner.constructor.name) {
				case 'Player':
					owner = this.owner.owner as Player;
					owner.addItems(targetShip.generic.recipe);
					if (Math.floor(xpToLevel(owner.xp + targetShip.generic.xp)) > Math.floor(xpToLevel(owner.xp))) {
						this.system.emit('player.levelup', owner.toJSON());
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

	static FromJSON(data: SerializedHardpoint, system: System): Hardpoint {
		return <Hardpoint>super.FromJSON(data, system, data);
	}

	static generic = genericHardpoints;
}
