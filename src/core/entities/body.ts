import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Level } from '../level';
import { Storage } from '../storage';
import { ItemID } from '../generic/items';
import type { SerializedEntity } from './entity';
import { Entity } from './entity';
import { Ship } from './ship';
import { randomCords, randomInt } from '../utils';

export interface SerializedCelestialBody extends SerializedEntity {
	fleetPosition: number[];
	fleet: string[];
	radius: number;
	rewards: Record<ItemID, number>;
}

export class CelestialBody extends Entity {
	fleet: Ship[] = [];
	rewards: Storage;
	radius = 0;
	fleetPosition: Vector3;
	option?: JQuery<HTMLElement>;

	get power(): number {
		return this.fleet.reduce((total, ship) => total + ship.generic.power, 0) ?? 0;
	}

	constructor(id: string, level: Level, { radius = 1, rewards = {}, fleetPosition = randomCords(randomInt(radius + 5, radius * 1.2), true), fleet = [] }) {
		super(id, level);
		this.radius = radius;
		this.rewards = Storage.FromJSON({ items: rewards, max: 1e10 });
		this.fleetPosition = fleetPosition;
		for (const shipOrType of fleet) {
			let ship: Ship;
			if (shipOrType instanceof Ship) {
				ship = shipOrType;
			} else {
				ship = new Ship(null, level, { type: shipOrType });
				ship.position.addInPlace(this.fleetPosition);
			}
			ship.parent = ship.owner = this;
			this.fleet.push(ship);
		}
		setTimeout(() => level.emit('body_created', this.toJSON()));
	}

	remove() {
		this.level.emit('body_removed', this.toJSON());
		super.remove();
	}

	toJSON(): SerializedCelestialBody {
		return Object.assign(super.toJSON(), {
			fleetPosition: this.fleetPosition.asArray(),
			fleet: this.fleet.map(ship => ship.id),
			rewards: this.rewards.toJSON().items,
			radius: this.radius,
		});
	}

	static FromJSON(data: SerializedCelestialBody, level: Level, constructorOptions): CelestialBody {
		return <CelestialBody>super.FromJSON(data, level, {
			...constructorOptions,
			radius: data.radius,
			rewards: data.rewards,
			fleetPosition: Vector3.FromArray(data.fleetPosition || [0, 0, 0]),
		});
	}
}
