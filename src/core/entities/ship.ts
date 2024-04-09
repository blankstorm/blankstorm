import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import { genericHardpoints } from '../generic/hardpoints';
import type { GenericShip, ShipType } from '../generic/ships';
import { genericShips } from '../generic/ships';
import type { Level } from '../level';
import type { System } from '../system';
import { randomCords, randomInt } from '../utils';
import type { CelestialBody } from './body';
import type { EntityJSON } from './entity';
import { Entity } from './entity';
import type { HardpointJSON } from './hardpoint';
import { Hardpoint } from './hardpoint';
import type { Player } from './player';
import { Container } from '../storage';

export interface ShipJSON extends EntityJSON {
	type: ShipType;
	hp: number;
	jumpCooldown: number;
	hardpoints: HardpointJSON[];
}

export class Ship extends Entity {
	public hardpoints: Set<Hardpoint> = new Set();
	public type: ShipType;
	public hp: number;
	public jumpCooldown: number;
	protected _storage: Container = new Container();

	public isTargetable = true;

	declare owner?: CelestialBody | Player;

	/**
	 * @todo move distance related stuff to ship creation
	 */
	public constructor(id: string, level: Level, type?: ShipType) {
		if (type && !genericShips[type]) throw new ReferenceError(`Ship type ${type} does not exist`);
		super(id, level);

		const { power, hardpoints } = genericShips[type];

		const distance = Math.log(randomInt(0, power || 1) ** 3 + 1);
		this.position.addInPlace(randomCords(distance, true));

		this.type = type;
		this._storage = new Container(this.generic.storage);
		this.hp = this.generic.hp;
		this.jumpCooldown = this.generic.jump.cooldown;

		for (const [i, info] of this.generic.hardpoints.entries()) {
			if (!Object.hasOwn(genericHardpoints, info.type)) {
				console.warn(`Hardpoint type "${info.type}" does not exist, skipping`);
				continue;
			}

			const hardpoint: Hardpoint = hardpoints[i] ? Hardpoint.From(hardpoints[i], level) : new Hardpoint(null, level, info);
			hardpoint.parent = this;
			this.hardpoints.add(hardpoint);
		}
	}

	public get generic(): GenericShip {
		return genericShips[this.type];
	}

	public remove() {
		super.remove();
		this.owner.fleet.delete(this);
	}

	public jumpTo(targetSystem: System) {
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

	public toJSON() {
		return {
			...super.toJSON(),
			type: this.type,
			hp: +this.hp.toFixed(3),
			jumpCooldown: +this.jumpCooldown.toFixed(),
			hardpoints: [...this.hardpoints].map(hp => hp.toJSON()),
		};
	}

	public from(data: ShipJSON, level: Level): void {
		super.from(data, level);
		this.type = data.type;
		this.hp = data.hp;
		this.jumpCooldown = data.jumpCooldown;
		this.storage.from(data.storage);
	}
}

export function generateFleetFromPower(power: number): ShipType[] {
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
