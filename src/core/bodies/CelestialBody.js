import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import { random } from '../utils.js';
import Ship from '../entities/Ship.js';
import Node from '../Node.js';
import Storage from '../Storage.js';

export default class CelestialBody extends Node {
	fleet = [];
	rewards = {};
	radius = 0;
	fleetPosition;

	get power() {
		return this.fleet.reduce((total, ship) => total + ship._generic.power, 0) ?? 0;
	}

	constructor(id, level, { radius, rewards, fleetPosition = random.cords(random.int(radius + 5, radius * 1.2), true) }) {
		super(id, level);
		this.radius = radius;
		this.rewards = Storage.FromData({ items: rewards, max: 1e10 });
		level.bodies.set(id, this);

		this.fleetPosition = fleetPosition;
		for (let shipOrType of fleet) {
			if (shipOrType instanceof Ship) {
				this.fleet.push(shipOrType);
			} else {
				let ship = new Ship(null, level, { type: shipOrType });
				ship.parent = ship.owner = this;
				ship.position.addInPlace(this.fleetPosition);
			}
		}
	}

	remove() {
		this.level.bodies.delete(this.id);
	}

	serialize() {
		return Object.assign(super.serialize(), {
			fleetPosition: this.fleetPosition.asArray().map(e => +e.toFixed(3)),
			fleet: this.fleet.map(ship => ship.id),
			rewards: this.rewards.serialize().items,
			radius: this.radius,
		});
	}

	static FromData(data, level, constructorOptions) {
		return super.FromData(data, level, {
			radius: data.radius,
			rewards: data.rewards,
			fleetPosition: Vector3.FromArray(data.fleetPosition || [0, 0, 0]),
			...constructorOptions,
		});
	}
}

/* For TypeScript in the future?
import type { ID } from '../utils.js';
import type { ItemCollection } from '../items.js';

export interface CelestialBodyOptions {
	id?: ID;
	radius?: number;
	fleet?: Ship[];
	biome?: string;
	owner?: Player | CelestialBody;
	rewards?: ItemCollection;
}
*/
