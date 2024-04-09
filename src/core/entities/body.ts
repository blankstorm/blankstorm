import { Fleet, type FleetJSON } from '../fleet';
import type { ItemID } from '../generic/items';
import type { Level } from '../level';
import { Storage } from '../storage';
import { randomCords, randomInt } from '../utils';
import type { EntityJSON } from './entity';
import { Entity } from './entity';
import { Ship } from './ship';

export interface CelestialBodyJSON extends EntityJSON {
	fleet: FleetJSON;
	radius: number;
	rewards: Record<ItemID, number>;
}

export class CelestialBody extends Entity {
	fleet?: Fleet;
	rewards: Storage;
	radius = 0;
	option?: JQuery<HTMLElement>;

	get power(): number {
		return this.fleet.power;
	}

	constructor(id: string, level: Level, { radius = 1, rewards = {}, fleet = { ships: [] } }) {
		super(id, level);
		this.radius = radius;
		this.rewards = Storage.FromJSON({ items: rewards, max: 1e10 });
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
		this.fleet.position ||= randomCords(randomInt(radius + 5, radius * 1.2), true);
		setTimeout(() => level.emit('body_created', this.toJSON()));
	}

	remove() {
		this.level.emit('body_removed', this.toJSON());
		super.remove();
	}

	toJSON(): CelestialBodyJSON {
		return {
			...super.toJSON(),
			fleet: this.fleet.toJSON(),
			rewards: this.rewards.toJSON().items,
			radius: this.radius,
		};
	}

	static FromJSON(data: CelestialBodyJSON, level: Level, constructorOptions): CelestialBody {
		return <CelestialBody>super.FromJSON(data, level, {
			...constructorOptions,
			radius: data.radius,
			rewards: data.rewards,
			fleet: Fleet.FromJSON(data.fleet),
		});
	}
}
