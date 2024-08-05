import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { xpToLevel } from '../utils';
import type { CelestialBody } from './body';
import { Entity, type EntityJSON } from './entity';
import type { Hardpoint } from './hardpoint';
import type { Player } from './player';
import type { Ship } from './ship';

export type ProjectileType = 'laser';

export interface ProjectileJSON extends EntityJSON {
	type: ProjectileType;
	target: string;
	hardpoint: string;
}

export class Projectile extends Entity {
	public type!: ProjectileType;
	public target!: Ship;
	public hardpoint!: Hardpoint;

	public get owner() {
		return this.hardpoint.owner;
	}

	public update(): void {
		const generic = this.hardpoint.generic;
		if (Vector3.Distance(this.absolutePosition, this.target.absolutePosition) < generic.activationDistance) {
			this.target.hp -= generic.damage * (Math.random() < generic.critChance ? generic.critFactor : 1);
		}
		if (this.target.hp <= 0) {
			this.level.emit('entity_death', this.target.toJSON());

			if (this.owner?.isType<Player>('Player')) {
				this.owner.storage.addItems(this.target.generic.recipe);
				if (Math.floor(xpToLevel(this.owner.xp + this.target.generic.xp)) > Math.floor(xpToLevel(this.owner.xp))) {
					this.level.emit('player_levelup', this.owner.toJSON());
				}
				this.owner.xp += this.target.generic.xp;
			}

			if (this.owner?.isType<CelestialBody>('CelestialBody')) {
				this.owner.storage.addItems(this.target.generic.recipe);
			}
			this.target.remove();
		}
	}

	public toJSON(): ProjectileJSON {
		return {
			...super.toJSON(),
			type: this.type,
			target: this.target.id,
			hardpoint: this.hardpoint.id,
		};
	}

	public fromJSON(data: Partial<ProjectileJSON>): void {
		super.fromJSON(data);
	}
}
