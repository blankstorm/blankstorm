import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { assignWithDefaults, pick, randomInt } from 'utilium';
import { Container } from '../components/storage';
import { genericHardpoints } from '../generic/hardpoints';
import type { GenericShip, ShipType } from '../generic/ships';
import { genericShips } from '../generic/ships';
import type { Level } from '../level';
import type { System } from '../system';
import { randomCords } from '../utils';
import type { EntityJSON } from './entity';
import { Entity } from './entity';
import type { HardpointJSON } from './hardpoint';
import { Hardpoint } from './hardpoint';

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

	public isTargetable = true;

	/**
	 * @todo move distance related stuff to ship creation (i.e. berth)
	 */
	constructor(id: string, level: Level, type?: ShipType) {
		super(id, level);

		this.type = type;
		const { power, hp, jump, storage, hardpoints } = genericShips[this.type];

		this.position.addInPlace(randomCords(Math.log(randomInt(0, power || 1) ** 3 + 1), true));

		this._storage = new Container(storage);
		this.hp = hp;
		this.jumpCooldown = jump.cooldown;

		for (const info of hardpoints) {
			if (!Object.hasOwn(genericHardpoints, info.type)) {
				console.warn('Hardpoint type does not exist (skipping): ' + info.type);
				continue;
			}

			const hardpoint = new Hardpoint(null, this.level, info);
			hardpoint.parent = this;
			this.hardpoints.add(hardpoint);
		}
	}

	public update() {
		super.update();
		if (this.hp <= 0) {
			this.level.emit('entity_death', this.toJSON());
			this.remove();
			return;
		}
		for (const hardpoint of this.hardpoints) {
			hardpoint.reload = Math.max(--hardpoint.reload, 0);

			const targets = [...this.level.entities].filter(e => {
				const distance = Vector3.Distance(e.absolutePosition, this.absolutePosition);
				return e.isTargetable && e.owner != this.owner && distance < hardpoint.generic.range;
			}, null);
			const target = targets.reduce((previous, current) => {
				const previousDistance = Vector3.Distance(previous?.absolutePosition ? previous.absolutePosition : Vector3.One().scale(Infinity), this.absolutePosition);
				const currentDistance = Vector3.Distance(current.absolutePosition, this.absolutePosition);
				return previousDistance < currentDistance ? previous : current;
			}, null);

			/**
			 * @todo Add support for targeting stations
			 */
			if (!(target instanceof Ship)) {
				continue;
			}

			const targetPoints = [...target.hardpoints, target].filter(targetHardpoint => {
				const distance = Vector3.Distance(targetHardpoint.absolutePosition, hardpoint.absolutePosition);
				return distance < hardpoint.generic.range;
			});
			const targetPoint = targetPoints.reduce((current, newPoint) => {
				if (!current || !newPoint) {
					return current;
				}
				const oldDistance = Vector3.Distance(current.absolutePosition, hardpoint.absolutePosition);
				const newDistance = Vector3.Distance(newPoint.absolutePosition, hardpoint.absolutePosition);
				return oldDistance < newDistance ? current : newPoint;
			}, target);

			if (hardpoint.reload <= 0) {
				hardpoint.reload = hardpoint.generic.reload;
				hardpoint.fire(targetPoint);
			}
		}
		this.jumpCooldown = Math.max(--this.jumpCooldown, 0);
	}

	public get generic(): GenericShip {
		return genericShips[this.type];
	}

	public remove() {
		super.remove();
		this.owner?.fleet?.delete(this);
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
		this.jumpCooldown = +this.generic.jump.cooldown;
	}

	public toJSON() {
		return {
			...super.toJSON(),
			...pick(this, 'type', 'jumpCooldown'),
			hp: +this.hp?.toFixed(3),
			hardpoints: [...this.hardpoints].map(hp => hp.toJSON()),
			storage: this.storage.toJSON(),
		};
	}

	public fromJSON(data: ShipJSON): void {
		super.fromJSON(data);
		if (!Object.hasOwn(genericShips, data.type)) {
			throw new ReferenceError('Ship type does not exist: ' + data.type);
		}
		assignWithDefaults(this, pick(data, 'type', 'hp', 'jumpCooldown'));
		this.storage.fromJSON(data.storage);
		if ('fleet' in this.owner) {
			this.owner.fleet.add(this);
		}
	}

	public static FromJSON(this: typeof Entity, data: EntityJSON, level: Level): Entity;
	public static FromJSON(this: typeof Ship, data: ShipJSON, level: Level): Ship {
		const entity = new this(data.id, level, data.type);
		entity.fromJSON(data);
		return entity;
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
