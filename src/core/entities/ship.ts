import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import { randomCords, randomInt } from '../utils';
import { ItemID } from '../generic/items';
import type { GenericShip, ShipType } from '../generic/ships';
import { genericShips } from '../generic/ships';
import type { Level } from '../level';
import { Storage } from '../storage';
import type { System } from '../system';
import type { CelestialBody } from './body';
import type { EntityJSON } from './entity';
import { Entity } from './entity';
import type { HardpointJSON } from './hardpoint';
import { Hardpoint } from './hardpoint';
import type { Player } from './player';
import { genericHardpoints } from '../generic/hardpoints';

export interface ShipJSON extends EntityJSON {
	type: ShipType;
	hp: number;
	storage: Record<ItemID, number>;
	jumpCooldown: number;
	hardpoints: HardpointJSON[];
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
	constructor(id: string, level: Level, { type, hardpoints = [], power }: { type: ShipType; hardpoints?: HardpointJSON[]; power?: number }) {
		if (type && !Ship.generic[type]) throw new ReferenceError(`Ship type ${type} does not exist`);
		super(id, level);

		const distance = Math.log(randomInt(0, power || 1) ** 3 + 1);
		this.position.addInPlace(randomCords(distance, true));

		this.type = type;
		this.storage = new Storage(this.generic.storage);
		this.hp = this.generic.hp;
		this.jumpCooldown = this.generic.jump.cooldown;

		for (const i in this.generic.hardpoints) {
			const info = this.generic.hardpoints[i];
			if (!Object.hasOwn(genericHardpoints, info.type)) {
				console.warn(`Hardpoint type "${info.type}" does not exist, skipping`);
				continue;
			}

			const hp: Hardpoint = hardpoints[i] ? Hardpoint.FromJSON(hardpoints[i], level) : new Hardpoint(null, level, info);
			hp.parent = this;
			hp.info = info;
			this.hardpoints.push(hp);
		}
	}

	get generic(): GenericShip {
		return Ship.generic[this.type];
	}

	remove() {
		super.remove();
		this.owner.fleet.delete(this);
	}

	jumpTo(targetSystem: System) {
		if (this.jumpCooldown) {
			return false;
		}

		const distance = Vector2.Distance(this.system.position, targetSystem.position);

		if (distance > this.generic.jump.range) {
			return false;
		}

		this.system = targetSystem;
		this.jumpCooldown = this.generic.jump.cooldown + 0;
	}

	toJSON() {
		return {
			...super.toJSON(),
			type: this.type,
			hp: +this.hp.toFixed(3),
			jumpCooldown: +this.jumpCooldown.toFixed(),
			storage: this.storage.toJSON().items,
			hardpoints: this.hardpoints.map(hp => hp.toJSON()),
		};
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

	static FromJSON(data: ShipJSON, level: Level): Ship {
		const max = this.generic[data.type].storage;
		const ship = <Ship>super.FromJSON(data, level, data);
		ship.hp = data.hp;
		ship.jumpCooldown = data.jumpCooldown;
		ship.storage = Storage.FromJSON({ items: data.storage, max });
		return ship;
	}

	static generic = genericShips;
}
