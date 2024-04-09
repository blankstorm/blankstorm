import { Fleet, type FleetJSON } from '../fleet';
import type { Level } from '../level';
import { Container } from '../storage';
import { randomCords, randomInt } from '../utils';
import type { EntityJSON } from './entity';
import { Entity } from './entity';
import { Ship } from './ship';

export interface CelestialBodyJSON extends EntityJSON {
	fleet: FleetJSON;
	radius: number;
}

export class CelestialBody extends Entity {
	public fleet: Fleet = new Fleet();
	public radius = 0;
	public option?: JQuery<HTMLElement>;
	protected _storage?: Container = new Container();

	public get power(): number {
		return this.fleet.power;
	}

	public constructor(id: string, level: Level, { radius = 1, fleet = { ships: [] } } = {}) {
		super(id, level);
		this.radius = radius;
		this.fleet.position ||= randomCords(randomInt(radius + 5, radius * 1.2), true);
		for (const shipOrType of fleet.ships) {
			let ship: Ship;
			if (shipOrType instanceof Ship) {
				ship = shipOrType;
			} else {
				ship = new Ship(null, level, { type: shipOrType });
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
			radius: this.radius,
		};
	}

	public from(data: Partial<CelestialBodyJSON>, level: Level): void {
		super.from(data, level);
		if ('storage' in data) {
			this.storage.from({ items: data.storage.items, max: 1e10 });
		}
		if ('fleet' in data) {
			this.fleet.from(data.fleet);
		}
		this.radius = data.radius || this.radius;
	}
}
