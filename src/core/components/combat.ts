import { Component, registerComponent } from 'deltablank/core/component.js';
import type { Entity, EntityJSON } from 'deltablank/core/entity.js';
import { ComponentError } from 'deltablank/core/errors.js';
import type { UUID } from 'utilium';
import type { Recipe } from '../data';
import type { Hardpoint, HardpointSlot, HardpointSlotJSON } from '../entities/hardpoints';
import type { BuildInfo } from './build';
import type { Owner } from './owner';

export type CombatTarget = Entity<[Combat, Owner]> & CombatMixin & { owner?: Entity } & Partial<BuildInfo>;

export interface CombatMixin {
	target: CombatTarget | null;
	isTargetable: boolean;
	hp: number;
	hardpoints: Set<Hardpoint>;
}

export interface CombatJSON {
	target: UUID | null;
	hp: number;
	hardpoints: UUID[];
}

export interface CombatConfig {
	hp: number;
	/** Hardpoints shouldn't have nested hardpoints */
	is_hardpoint?: boolean;
	hardpoints: HardpointSlot[];
	is_targetable?: boolean;
	/** Whether this entity can auto-spawn as an enemy. Only useful for ships at the moment */
	enemy?: boolean;
	xp_yield?: number;
	/** Used for enemy fleet generation */
	power?: number;
	recipe?: Recipe;
}

export interface CombatConfigJSON extends Omit<CombatConfig, 'hardpoints'> {
	hardpoints: HardpointSlotJSON[];
}

@registerComponent
export class Combat extends Component<CombatMixin, CombatJSON, CombatConfig> {
	setup(): CombatMixin {
		return {
			isTargetable: this.config.is_targetable ?? true,
			hp: this.config.hp,
			hardpoints: new Set(),
			target: null,
		};
	}

	async tick(): Promise<void> {
		if (this.entity.hp > 0) return;
		this.entity.level.emit('entity_death', this.entity.toJSON());
		await this.entity.dispose();
	}

	toJSON(): CombatJSON {
		return {
			target: this.entity.target?.id ?? null,
			hp: this.entity.hp,
			hardpoints: Array.from(this.entity.hardpoints).map(hp => hp.id),
		};
	}

	load(data: EntityJSON & CombatJSON): void {
		this.entity.hp = data.hp;

		if (data.target) {
			const target = this.entity.level.getEntityByID(data.target);

			if (!target.hasComponent(Combat)) throw new ComponentError(this, 'target is missing Combat component');
		}
	}
}
