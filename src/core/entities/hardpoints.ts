import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CopyData } from 'deltablank/core/component.js';
import type { Entity, EntityConfig } from 'deltablank/core/entity.js';
import { EntityWithComponents, registerEntity } from 'deltablank/core/entity.js';
import { randomFloat } from 'utilium';
import { Combat, EntitySystem, Owner, type CombatMixin, type CombatTarget } from '../components';
import { randomInSphere } from '../utils';
import { Projectile, type ProjectileType } from './projectile';

export interface HardpointConfig {
	hp: number;
	damage: number;
	/**
	 * Reload time in ticks
	 */
	reload: number;
	range: number;
	critChance: number;
	critFactor: number;
	activationDistance: number;
	accuracy: number;
	projectile: {
		type: ProjectileType;
		count: number;
		speed: number;
	};
	/**
	 * For burst weapons
	 */
	interval: number;
}

export interface HardpointSlot {
	type: HardpointType;
	position: Vector3;
	rotation?: Vector3;
	scale?: number;
}

export interface HardpointSlotJSON {
	type: string;
	position: number[];
	rotation?: number[];
	scale: number;
}

export function parseSlot(slot: HardpointSlotJSON): HardpointSlot {
	return {
		...slot,
		type: slot.type as HardpointType,
		position: Vector3.FromArray(slot.position),
		rotation: slot.rotation ? Vector3.FromArray(slot.rotation) : Vector3.Zero(),
	};
}

export const hardpointConfig = {
	laser_cannon_double: {
		hp: 6,
		damage: 1,
		reload: 60,
		range: 200,
		critChance: 0.05,
		critFactor: 1.5,
		activationDistance: 1,
		accuracy: 0.5,
		projectile: {
			type: 'laser',
			count: 1,
			speed: 50,
		},
		interval: 0,
	},
} as const satisfies Record<string, HardpointConfig>;

export type HardpointType = keyof typeof hardpointConfig;

@registerEntity
export class Hardpoint extends EntityWithComponents(CopyData, Combat, EntitySystem) {
	static config = {
		copy_data: ['hardpointType', 'scale', 'reload'],
		hp: 1,
		is_hardpoint: true,
		hardpoints: [],
	} satisfies EntityConfig<[CopyData, Combat]>;

	public hardpointType!: HardpointType;
	public scale!: number;
	public reload!: number;

	public readonly projectiles: Set<Projectile> = new Set();

	declare public parent: Entity & CombatMixin & { owner?: Entity };

	public get config(): HardpointConfig {
		return hardpointConfig[this.hardpointType];
	}

	onSetup(): void {
		this.reload ??= this.config.reload;
		this.hp = this.config.hp;
	}

	onDispose(): void {
		this.parent.hardpoints.delete(this);
	}

	onTick(): void {
		this.reload = Math.max(--this.reload, 0);

		const targets: {
			entity: CombatTarget | null;
			distance: number;
		}[] = [];

		// Find all valid targets within range
		for (const entity of this.level.entities) {
			if (!entity.hasComponent(Combat) || !entity.isTargetable || (entity.hasComponent(Owner) && entity.owner == this.parent.owner))
				continue;
			const distance = Vector3.Distance(entity.absolutePosition, this.absolutePosition);
			if (distance < this.config.range) continue;
			targets.push({ entity: entity as CombatTarget, distance });
		}

		const target = targets.reduce((previous, current) => (previous && previous.distance < current.distance ? previous : current), {
			entity: null,
			distance: Infinity,
		});
		if (target) this.target = target.entity;

		if (!this.target || this.reload > 0) return;

		this.reload = this.config.reload;

		const targetPosition = this.target.absolutePosition.add(randomInSphere(randomFloat(0, 1 / this.config.accuracy)));

		const projectile = new Projectile(undefined, this.level);
		Object.assign(projectile, {
			projectileType: this.config.projectile.type,
			firedFrom: this.id,
			hardpoint: this,
			target: this.target,
			velocity: targetPosition.subtract(this.absolutePosition).normalize().scale(this.config.projectile.speed),
		});

		this.projectiles.add(projectile);
	}
}
