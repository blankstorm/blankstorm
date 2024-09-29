import type { WithRequired } from 'utilium';
import { assignWithDefaults, pick } from 'utilium';
import { Fleet } from '../components/fleet';
import { Container } from '../components/storage';
import type { System } from '../system';
import { getEntityIcon } from '../utils';
import type { EntityJSON } from './entity';
import { Entity } from './entity';
import { Waypoint } from './waypoint';

export interface CelestialBodyJSON extends WithRequired<EntityJSON, 'storage'> {
	fleet: string;
	radius: number;
	seed: number;
}

export class CelestialBody extends Entity {
	public fleet: Fleet;
	public radius = 1;
	public seed: number = Math.random();
	public option?: JQuery<HTMLElement>;
	protected _storage?: Container = new Container(1e10);

	public waypoint!: string;

	public constructor(id: string | undefined, system: System) {
		super(id, system);
		this.fleet = new Fleet(undefined, this.system);
		this.fleet.parent = this;
	}

	public get power(): number {
		return this.fleet.power;
	}

	public update() {
		super.update();
		if (this.waypoint) {
			return;
		}
		const wp = new Waypoint(undefined, this.system);

		assignWithDefaults(wp, {
			...pick(this, 'name', 'position', 'system'),
			builtin: true,
			readonly: true,
			color: '#88ddff',
			icon: getEntityIcon(this.toJSON()),
		});

		this.waypoint = wp.id;
	}

	public toJSON(): CelestialBodyJSON {
		return {
			...super.toJSON(),
			...pick(this, 'radius', 'seed'),
			fleet: this.fleet.id,
			storage: this.storage.toJSON(),
		};
	}

	public fromJSON(data: Partial<CelestialBodyJSON>): void {
		super.fromJSON(data);
		assignWithDefaults(this as CelestialBody, pick(data, 'radius', 'seed'));
		if (data.storage) {
			this.storage.fromJSON({ items: data.storage.items, max: 1e10 });
		}
		// Note: Fleet loaded after CelestialBody
	}
}
