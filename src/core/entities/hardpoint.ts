import { Vector3 } from '@babylonjs/core/Maths/math.vector';

import type { Level } from '../level';
import type { GenericHardpoint, HardpointType } from '../generic/hardpoints';
import { genericHardpoints } from '../generic/hardpoints';
import type { HardpointInfo, SerializedHardpointInfo } from '../generic/ships';
import { resolveConstructors, wait, xpToLevel } from '../utils';
import type { CelestialBody } from './body';
import type { SerializedEntity } from './entity';
import { Entity } from './entity';
import type { Player } from './player';
import type { Ship } from './ship';

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
	constructor(id: string, level: Level, { type, reload }: { type?: HardpointType; reload?: number } = {}) {
		super(id, level);

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

		this.level.emit('projectile_fire', this.id, target.id, this.generic.projectile);
		const time = Vector3.Distance(this.absolutePosition, target.absolutePosition) / this.generic.projectile.speed;
		this.reload = this.generic.reload;
		await wait(time);
		const targetShip = (targetConstructors.includes('Ship') ? target : target.owner) as Ship;
		targetShip.hp -= this.generic.damage * (Math.random() < this.generic.critChance ? this.generic.critFactor : 1);
		if (targetShip.hp <= 0) {
			this.level.emit('entity_death', targetShip.toJSON());
			let owner;
			switch (this.owner.owner.constructor.name) {
				case 'Player':
					owner = this.owner.owner as Player;
					owner.addItems(targetShip.generic.recipe);
					if (Math.floor(xpToLevel(owner.xp + targetShip.generic.xp)) > Math.floor(xpToLevel(owner.xp))) {
						this.level.emit('player_levelup', owner.toJSON());
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

	static FromJSON(data: SerializedHardpoint, level: Level): Hardpoint {
		return <Hardpoint>super.FromJSON(data, level, data);
	}

	static generic = genericHardpoints;
}
