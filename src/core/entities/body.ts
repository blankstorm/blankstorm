import { assignWithDefaults, pick, randomInt } from 'utilium';
import { Fleet, type FleetJSON } from '../components/fleet';
import type { Level } from '../level';
import { Container } from '../components/storage';
import { randomCords } from '../utils';
import type { EntityJSON } from './entity';
import { Entity } from './entity';
import { Ship } from './ship';

export interface CelestialBodyJSON extends EntityJSON {
	fleet: FleetJSON;
	radius: number;
	seed: number;
}

export class CelestialBody extends Entity {
	public fleet: Fleet = new Fleet();
	public radius = 0;
	public seed: number;
	public option?: JQuery<HTMLElement>;
	protected _storage?: Container = new Container(1e10);

	public get power(): number {
		return this.fleet.power;
	}

	public constructor(id: string, level: Level, { seed = Math.random(), radius = 1, fleet = { ships: [] } } = {}) {
		super(id, level);
		this.radius = radius;
		this.seed = seed;
		this.fleet.position ||= randomCords(randomInt(radius + 5, radius * 1.2), true);
		for (const shipOrType of fleet.ships) {
			let ship: Ship;
			if (shipOrType instanceof Ship) {
				ship = shipOrType;
			} else {
				ship = new Ship(null, level, shipOrType);
				ship.position.addInPlace(this.fleet.position);
			}
			ship.parent = ship.owner = this;
			this.fleet.add(ship);
		}
		setTimeout(() => level.emit('body_created', this.toJSON()));
	}

	public remove() {
		this.level.emit('body_removed', this.toJSON());
		super.remove();
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
		if ('storage' in data) {
			this.storage.fromJSON({ items: data.storage.items, max: 1e10 });
		}
		if ('fleet' in data) {
			this.fleet.owner = this;
			this.fleet.fromJSON(data.fleet);
		}
		assignWithDefaults(this, pick(data, 'radius', 'seed'));
	}
}
