import { Vector3 } from '@babylonjs/core/Maths/math.vector';

import { random } from '../utils';
import { Entity } from './Entity';
import type { SerializedEntity } from './Entity';
import { Hardpoint } from './Hardpoint';
import type { SerializedHardpoint } from './Hardpoint';
import { Storage } from '../Storage';
import type { Level } from '../Level';
import { genericShips } from '../generic/ships';
import type { ShipType, GenericShip, HardpointInfo } from '../generic/ships';
import type { ItemCollection } from '../generic/items';
import type { CelestialBody } from '../bodies/CelestialBody';
import type { Player } from './Player';
import type { HardpointType } from '../generic/hardpoints';

export interface SerializedShip extends SerializedEntity {
	type: ShipType;
	hp: number;
	storage: ItemCollection;
	jumpCooldown: number;
	hardpoints: SerializedHardpoint[];
}

export class Ship extends Entity {
	hardpoints: Hardpoint[] = [];
	type: ShipType;
	hp: number;
	storage: Storage;
	jumpCooldown: number;

	isTargetable = true;

	declare owner?: CelestialBody | Player;

	/**
	 * @todo move distance related stuff to ship creation
	 */
	constructor(id: string, level: Level, { type, hardpoints = [], power }: { type: ShipType; hardpoints?: SerializedHardpoint[]; power?: number }) {
		if (type && !Ship.generic[type]) throw new ReferenceError(`Ship type ${type} does not exist`);
		super(id, level);

		const distance = Math.log(random.int(0, power || 1) ** 3 + 1);
		this.position.addInPlace(random.cords(distance, true));

		this.type = type;
		this.storage = new Storage(this.generic.storage);
		this.hp = this.generic.hp;
		this.jumpCooldown = this.generic.jumpCooldown;

		this.generic.hardpoints.forEach((info: HardpointInfo, i: number) => {
			if (!Hardpoint.generic[info.type]) {
				console.warn(`Hardpoint type ${info.type} doesn't exist, skipping`);
				return;
			}

			const hp: Hardpoint = hardpoints[i] ? Hardpoint.FromData(hardpoints[i], level) : new Hardpoint(null, level, { type: info.type as HardpointType });
			hp.parent = hp.owner = this;
			hp.info = info;
			this.hardpoints.push(hp);
		});
	}

	get generic(): GenericShip {
		return Ship.generic[this.type];
	}

	remove() {
		super.remove();
		this.owner.fleet.splice(this.owner.fleet.indexOf(this), 1);
	}

	jump(location) {
		if (!(location instanceof Vector3)) throw new TypeError('Location is not a Vector3');
		if (this.jumpCooldown > 0) return 'Hyperspace still on cooldown';
		if (Vector3.Distance(this.position, location) > this.generic.jumpRange) return 'Target location out of range';

		this.position = location.clone();
		this.jumpCooldown = this.generic.jumpCooldown;
	}

	serialize() {
		return Object.assign(super.serialize(), {
			type: this.type,
			hp: +this.hp.toFixed(3),
			jumpCooldown: +this.jumpCooldown.toFixed(),
			storage: this.storage.serialize().items,
			hardpoints: this.hardpoints.map(hp => hp.serialize()),
		});
	}

	static GenerateFleetFromPower(power: number): ShipType[] {
		//enemy spawning algorithm
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

	static FromData(data: SerializedShip, level: Level): Ship {
		const max = this.generic[data.type].storage;
		const ship = super.FromData(data, level, data) as Ship;
		ship.hp = data.hp;
		ship.jumpCooldown = data.jumpCooldown;
		ship.storage = Storage.FromData({ ...data.storage, max });
		return ship;
	}

	static generic = genericShips;
}
