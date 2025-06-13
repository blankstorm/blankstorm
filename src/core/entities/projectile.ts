import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CopyData } from 'deltablank/core/component.js';
import { EntityWithComponents, registerEntity, type Entity, type EntityConfig } from 'deltablank/core/entity.js';
import type { UUID } from 'utilium';
import { Build, Combat, ItemStorage, Owner, Velocity, type CombatMixin } from '../components';
import { xpToLevel } from '../utils';
import type { Hardpoint } from './hardpoints';
import type { Player } from './player';

export type ProjectileType = 'laser';

@registerEntity
export class Projectile extends EntityWithComponents(Combat, CopyData, Velocity, Owner) {
	static config = {
		copy_data: ['projectileType', 'firedFrom'],
		hp: 1,
		hardpoints: [],
		is_hardpoint: false,
		is_targetable: false,
	} satisfies EntityConfig<[Combat, CopyData, Velocity, Owner]>;

	public projectileType!: ProjectileType;
	public firedFrom!: UUID;
	public hardpoint!: Hardpoint;

	declare owner: Entity & CombatMixin;

	public async onTick(): Promise<void> {
		const generic = this.hardpoint.config;

		if (!this.target) return;

		if (Vector3.Distance(this.absolutePosition, this.target.absolutePosition) < generic.activationDistance) {
			this.target.hp -= generic.damage * (Math.random() < generic.critChance ? generic.critFactor : 1);
		}

		if (this.target.hp > 0) return;

		this.level.emit('entity_death', this.target.toJSON());

		if (this.owner?.hasComponent(ItemStorage) && this.target.hasComponent(Build)) {
			this.owner.storage.addItems(this.target.constructor.config.recipe!.items);
		}

		if (this.owner?.isType<Player>('Player')) {
			const { xp_yield = 0 } = this.target.constructor.config;
			if (Math.floor(xpToLevel(this.owner.xp + xp_yield)) > Math.floor(xpToLevel(this.owner.xp))) {
				// level up
			}
			this.owner.xp += xp_yield;
		}

		await this.target.dispose();
	}
}
