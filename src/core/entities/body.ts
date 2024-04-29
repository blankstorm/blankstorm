import { assignWithDefaults, pick, randomInt } from 'utilium';
import { Fleet, type FleetJSON } from '../components/fleet';
import { Container } from '../components/storage';
import { randomCords } from '../utils';
import type { EntityJSON } from './entity';
import { Entity } from './entity';

export interface CelestialBodyJSON extends EntityJSON {
	fleet: FleetJSON;
	radius: number;
	seed: number;
}

export class CelestialBody extends Entity {
	public fleet: Fleet = new Fleet(this);
	public radius = 1;
	public seed: number = Math.random();
	public option?: JQuery<HTMLElement>;
	protected _storage?: Container = new Container(1e10);

	public get power(): number {
		return this.fleet.power;
	}

	public toJSON(): CelestialBodyJSON {
		return {
			...super.toJSON(),
			fleet: this.fleet.toJSON(),
			storage: this.storage.toJSON(),
			radius: this.radius,
			seed: this.seed,
		};
	}

	public fromJSON(data: Partial<CelestialBodyJSON>): void {
		super.fromJSON(data);
		assignWithDefaults(this, pick(data, 'radius', 'seed'));
		if ('storage' in data) {
			this.storage.fromJSON({ items: data.storage.items, max: 1e10 });
		}
		if ('fleet' in data) {
			this.fleet.owner = this;
			this.fleet.fromJSON(data.fleet);
			this.fleet.position ||= randomCords(randomInt(this.radius + 5, this.radius * 1.2), true);
		}
	}
}
