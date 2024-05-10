import { assignWithDefaults, pick } from 'utilium';
import { getEntityIcon } from '../../client/utils';
import { Fleet } from '../components/fleet';
import { Container } from '../components/storage';
import type { EntityJSON } from './entity';
import { Entity } from './entity';
import { Waypoint } from './waypoint';

export interface CelestialBodyJSON extends EntityJSON {
	fleet: string;
	radius: number;
	seed: number;
	waypoint: string;
}

export class CelestialBody extends Entity {
	public fleet: Fleet = new Fleet(this);
	public radius = 1;
	public seed: number = Math.random();
	public option?: JQuery<HTMLElement>;
	protected _storage?: Container = new Container(1e10);

	public waypoint: string;

	public get power(): number {
		return this.fleet.power;
	}

	public update() {
		super.update();
		if (this.waypoint) {
			return;
		}
		const wp = new Waypoint(null, this.level);
		assignWithDefaults(wp, pick(this, 'name', 'position', 'system'));
		wp.builtin = true;
		wp.readonly = true;
		wp.color = '#88ddff';
		wp.icon = getEntityIcon(this.toJSON());
		this.waypoint = wp.id;
	}

	public toJSON(): CelestialBodyJSON {
		return {
			...super.toJSON(),
			...pick(this, 'radius', 'seed', 'waypoint'),
			fleet: this.fleet.id,
			storage: this.storage.toJSON(),
		};
	}

	public fromJSON(data: Partial<CelestialBodyJSON>): void {
		super.fromJSON(data);
		assignWithDefaults(this, pick(data, 'radius', 'seed', 'waypoint'));
		if ('storage' in data) {
			this.storage.fromJSON({ items: data.storage.items, max: 1e10 });
		}
	}
}
