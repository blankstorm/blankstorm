import { assignWithDefaults, pick, randomFloat } from 'utilium';
import type { GenericHardpoint, HardpointType } from '../generic/hardpoints';
import { genericHardpoints } from '../generic/hardpoints';
import type { HardpointInfo } from '../generic/ships';
import type { Level } from '../level';
import { randomInSphere } from '../utils';
import type { CelestialBody } from './body';
import type { EntityJSON } from './entity';
import { Entity } from './entity';
import type { Player } from './player';
import { Projectile } from './projectile';
import type { Ship } from './ship';
import type { System } from '../system';

export interface HardpointJSON extends EntityJSON {
	type: HardpointType;
	scale: number;
	reload: number;
}

const copy = ['type', 'scale', 'reload'] as const satisfies ReadonlyArray<keyof Hardpoint>;

export class Hardpoint extends Entity {
	public type!: HardpointType;
	public scale!: number;
	public reload!: number;

	public readonly projectiles: Set<Projectile> = new Set();

	public declare parent: Ship;

	public get owner(): Player | CelestialBody | undefined {
		return this.parent.owner;
	}

	public constructor(id: string | undefined, system: System, info: HardpointInfo) {
		super(id, system);
		this.fromJSON(info);
	}

	public get generic(): GenericHardpoint {
		return genericHardpoints[this.type];
	}

	public remove(): void {
		super.remove();
		if (!this.parent) {
			return;
		}
		this.parent.hardpoints.delete(this);
	}

	public toJSON(): HardpointJSON {
		return {
			...super.toJSON(),
			...pick(this, copy),
		};
	}

	public fromJSON(data: Partial<HardpointJSON>): void {
		super.fromJSON(data);
		assignWithDefaults(this as Hardpoint, pick(data, copy));
		this.reload ??= this.generic.reload;
	}

	public async fire(target: Ship | Hardpoint): Promise<void> {
		this.reload = this.generic.reload;
		const projectile = new Projectile(undefined, this.system);
		projectile.hardpoint = this;
		const targetPosition = target.absolutePosition.add(randomInSphere(randomFloat(0, 1 / this.generic.accuracy)));
		projectile.velocity = targetPosition.subtract(this.absolutePosition).normalize().scale(this.generic.projectileSpeed);
		projectile.target = target.isType<Ship>('Ship') ? target : target.parent;
		this.projectiles.add(projectile);
	}
}
