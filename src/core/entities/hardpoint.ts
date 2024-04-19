import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { assignWithDefaults, pick, resolveConstructors, wait } from 'utilium';
import type { GenericHardpoint, HardpointType } from '../generic/hardpoints';
import { genericHardpoints } from '../generic/hardpoints';
import type { HardpointInfo } from '../generic/ships';
import type { Level } from '../level';
import { xpToLevel } from '../utils';
import type { CelestialBody } from './body';
import type { EntityJSON } from './entity';
import { Entity } from './entity';
import type { Player } from './player';
import type { Ship } from './ship';

export interface HardpointJSON extends EntityJSON {
	type: HardpointType;
	scale: number;
	reload: number;
}

const copy = ['type', 'scale', 'reload'] as const satisfies ReadonlyArray<keyof Hardpoint>;

export class Hardpoint extends Entity {
	public type: HardpointType;
	public scale: number;
	public reload: number;
	public declare owner: Ship;
	public constructor(id: string, level: Level, info: HardpointInfo) {
		super(id, level);
		this.fromJSON(info);
	}

	public get generic(): GenericHardpoint {
		return genericHardpoints[this.type];
	}

	public remove() {
		super.remove();
		if (this.owner) {
			this.owner.hardpoints.delete(this);
		}
	}

	public toJSON(): HardpointJSON {
		return {
			...super.toJSON(),
			...pick(this, copy),
		};
	}

	public fromJSON(data: Partial<HardpointJSON>): void {
		super.fromJSON(data);
		assignWithDefaults(this, pick(data, copy));
		this.reload ??= this.generic.reload;
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
		const targetShip = (targetConstructors.includes('Ship') ? target : target.parent) as Ship;
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
}
