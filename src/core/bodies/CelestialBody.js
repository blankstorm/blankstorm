import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import { random } from '../utils.js';
import Ship from '../entities/Ship.js';
import Node from '../Node.js';
import StorageData from '../StorageData.js';

export default class CelestialBody extends Node {
	fleet = [];
	rewards = {};
	radius = 0;
	fleetPosition;

	get power() {
		return this.fleet.reduce((total, ship) => total + ship._generic.power, 0) ?? 0;
	}

	constructor({
		id = random.hex(32),
		name = '',
		radius = 1,
		fleet = [],
		owner,
		parent,
		rewards = {},
		position = Vector3.Zero(),
		rotation = Vector3.Zero(),
		fleetPosition = random.cords(random.int(radius + 5, radius * 1.2), true),
		level,
	}) {
		super({ id, name, owner, parent, position, rotation, level });
		this.radius = radius;
		this.rewards = StorageData.FromData({ items: rewards, max: 1e10 });
		level.bodies.set(id, this);

		this.fleetPosition = fleetPosition;
		for (let shipOrType of fleet) {
			if (shipOrType instanceof Ship) {
				this.fleet.push(shipOrType);
			} else {
				let ship = new Ship({ type: shipOrType, owner: this, parent: this, level });
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

	static FromData(data, level) {
		const owner = level.getNodeByID(data.owner);
		return new this({
			id: data.id,
			name: data.name,
			radius: data.radius,
			rewards: data.rewards,
			position: Vector3.FromArray(data.position || [0, 0, 0]),
			rotation: Vector3.FromArray(data.rotation || [0, 0, 0]),
			fleetPosition: Vector3.FromArray(data.fleetPosition || [0, 0, 0]),
			owner,
			level,
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
