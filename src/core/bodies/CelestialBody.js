import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import { random } from '../utils.js';
import Ship from '../entities/Ship.js';

export default class CelestialBody {
	fleet = [];
	rewards = {};
	owner = null;
	fleetPosition = Vector3.Zero();
	position;
	rotation;

	get power() {
		return this.fleet.reduce((total, ship) => total + ship._generic.power, 0) ?? 0;
	}

	constructor(id = random.hex(32), { name = '', radius = 1, fleet = [], owner = null, rewards = {}, position = Vector3.Zero(), rotation = Vector3.Zero() }, level) {

		Object.assign(this, { id, name, owner, radius, rewards, level, position, rotation });
		level.bodies.set(id, this);

		this.fleetPosition = random.cords(random.int(radius + 5, radius * 1.2), true);
		for (let shipOrType of fleet) {
			if (shipOrType instanceof Ship) {
				this.fleet.push(shipOrType);
			} else {
				let ship = new Ship({ className: shipOrType, owner: this, level});
				ship.position.addInPlace(this.fleetPosition);
			}
		}
	}

	remove() {
		this.level.bodies.delete(this.id);
	}

	serialize(){
		return {
			id: this.id,
			type: this.constructor.name.toLowerCase(),
			name: this.name,
			position: this.position.asArray().map(e => e.toFixed(3)),
			rotation: this.rotation.asArray().map(e => e.toFixed(3)),
			fleetPosition: this.fleetPosition.asArray().map(e => e.toFixed(3)),
			owner: this.owner?.id,
			fleet: this.fleet.map(ship => ship.id)
		}
	}

	static FromData(data, level){
		data ||= {};
		let body = new CelestialBody(data.name, {
			id: data.id,
			radius: data.radius,
			rewards: data.rewards,
			position: Vector3.FromArray(data.position || [0, 0, 0]),
			rotation: Vector3.FromArray(data.rotation || [0, 0, 0]),
			fleetPosition: Vector3.FromArray(data.fleetPosition || [0, 0, 0]),
		});

		if(level.playerData.has(data.owner)){
			body.owner = level.playerData.get(data.owner);
		}else if(level.bodies.has(data.owner)){
			body.owner = level.bodies.get(data.owner);
		}
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