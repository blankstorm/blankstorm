import { Vector3 } from '@babylonjs/core/Maths/math.vector';

import type { Level } from '../Level';
import { Storage } from '../components/storage';
import type { GenericShip, HardpointInfo, ShipType } from '../generic/ships';
import { genericShips } from '../generic/ships';
import { randomCords, randomInt } from '../utils';
import { Hardpoint } from './Hardpoint';

import type { Combat } from '../components/combat';
import type { Fleet } from '../components/fleet';
import type { Jump } from '../components/jump';
import type { Owner } from '../components/owner';
import { genericHardpoints, type HardpointType } from '../generic/hardpoints';
import { Entity, type EntityData } from './Entity';
import type { Hardpoints } from '../components/hardpoints';
import type { JSONValue } from '../components/json';

export class Ship extends Entity<{
	combat: Combat;
	jump: Jump;
	owner: Owner;
	storage: Storage;
	hardpoints: Hardpoints;
	type: JSONValue<ShipType>;
}> {
	/**
	 * @todo move distance related stuff to ship creation
	 */
	constructor(id: string, level: Level, { type, hardpoints = [], power }: { type: ShipType; hardpoints?: EntityData<Hardpoint>[]; power?: number }) {
		const generic = genericShips[type];
		if (type && !generic) throw new ReferenceError(`Ship type ${type} does not exist`);
		super(id, level, {
			combat: { hp: generic.hp, power: generic.power, isTargetable: true },
			jump: generic.jump,
			owner: null,
			storage: { max: generic.storage },
			hardpoints,
			type,
		});

		const distance = Math.log(randomInt(0, power || 1) ** 3 + 1);
		this.position.addInPlace(Vector3.FromArray(randomCords(distance, true)));

		this.get('type').value = type;

		this.generic.hardpoints.forEach((info: HardpointInfo, i: number) => {
			if (!genericHardpoints[info.type]) {
				console.warn(`Hardpoint type ${info.type} doesn't exist, skipping`);
				return;
			}

			const hp: Hardpoint = hardpoints[i] ? Hardpoint.FromJSON(hardpoints[i], level) : new Hardpoint(null, level, { type: info.type as HardpointType });
			hp.parent = this;
			hp.get('info').value = info;
			this.hardpoints.add(hp);
		});
	}

	get generic(): GenericShip {
		return genericShips[this.get('type').value];
	}

	remove() {
		super.remove();
		const owner = this.get('owner').owner;
		if (!owner.has('fleet')) {
			return;
		}

		owner.get<Fleet>('fleet').ships.delete(this);
	}
}

/**
 * Enemy spawning algorithm
 */
export function generateFleetFromPower(power: number): ShipType[] {
	const fleet = [],
		generic = [...Object.entries(genericShips)];
	generic.sort((a, b) => b[1].power - a[1].power); //decending
	for (const [name, ship] of generic) {
		for (let i = 0; i < Math.floor(power / ship.power); i++) {
			fleet.push(name);
			power -= ship.power;
		}
	}
	return fleet;
}
