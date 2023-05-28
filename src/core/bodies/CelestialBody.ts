import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Level } from '../Level';
import { random } from '../utils';
import { Ship } from '../entities/Ship';
import { Node } from '../Node';
import type { SerializedNode } from '../Node';
import { Storage } from '../Storage';
import type { ItemCollection } from '../generic/items';

export interface SerializedCelestialBody extends SerializedNode {
	fleetPosition: number[];
	fleet: string[];
	radius: number;
	rewards: ItemCollection;
}

export class CelestialBody extends Node {
	fleet: Ship[] = [];
	rewards: Storage;
	radius = 0;
	fleetPosition: Vector3;
	option?: JQuery<HTMLElement>;

	get power(): number {
		return this.fleet.reduce((total, ship) => total + ship.generic.power, 0) ?? 0;
	}

	constructor(id: string, level: Level, { radius = 1, rewards = {}, fleetPosition = random.cords(random.int(radius + 5, radius * 1.2), true), fleet = [] }) {
		super(id, level);
		this.radius = radius;
		this.rewards = Storage.FromData({ items: rewards, max: 1e10 });
		this.fleetPosition = fleetPosition;
		level.bodies.set(this.id, this);
		for (const shipOrType of fleet) {
			if (shipOrType instanceof Ship) {
				this.fleet.push(shipOrType);
			} else {
				const ship = new Ship(null, level, { type: shipOrType });
				ship.parent = ship.owner = this;
				ship.position.addInPlace(this.fleetPosition);
			}
		}
		setTimeout(() => level.emit('body.created', this.serialize()));
	}

	remove() {
		this.level.emit('body.removed', this.serialize());
		this.level.bodies.delete(this.id);
	}

	serialize(): SerializedCelestialBody {
		return Object.assign(super.serialize(), {
			fleetPosition: this.fleetPosition.asArray(),
			fleet: this.fleet.map(ship => ship.id),
			rewards: this.rewards.serialize().items,
			radius: this.radius,
		});
	}

	static FromData(data: SerializedCelestialBody, level: Level, constructorOptions): CelestialBody {
		return super.FromData(data, level, {
			...constructorOptions,
			radius: data.radius,
			rewards: data.rewards,
			fleetPosition: Vector3.FromArray(data.fleetPosition || [0, 0, 0]),
		}) as CelestialBody;
	}
}
