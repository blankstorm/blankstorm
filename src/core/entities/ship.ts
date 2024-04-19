import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { assignWithDefaults, pick, randomInt } from 'utilium';
import { genericHardpoints } from '../generic/hardpoints';
import type { GenericShip, ShipType } from '../generic/ships';
import { genericShips } from '../generic/ships';
import type { Level } from '../level';
import { Container } from '../components/storage';
import type { System } from '../system';
import { randomCords } from '../utils';
import type { CelestialBody } from './body';
import type { EntityJSON } from './entity';
import { Entity } from './entity';
import type { HardpointJSON } from './hardpoint';
import { Hardpoint } from './hardpoint';
import type { Player } from './player';

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

	public update() {
		super.update();
		if (this.hp <= 0) {
			this.remove();
			this.level.emit('entity_death', this.toJSON());
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

	/**
	 * @todo move distance related stuff to ship creation
	 */
	public constructor(id: string, level: Level, type?: ShipType) {
		if (type && !genericShips[type]) throw new ReferenceError(`Ship type ${type} does not exist`);
		super(id, level);

		const { power } = genericShips[type];

		const distance = Math.log(randomInt(0, power || 1) ** 3 + 1);
		this.position.addInPlace(randomCords(distance, true));

		this.type = type;
		this._storage = new Container(this.generic.storage);
		this.hp = this.generic.hp;
		this.jumpCooldown = this.generic.jump.cooldown;

		for (const info of this.generic.hardpoints) {
			if (!Object.hasOwn(genericHardpoints, info.type)) {
				console.warn(`Hardpoint type "${info.type}" does not exist, skipping`);
				continue;
			}

			const hardpoint = new Hardpoint(null, level, info);
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

	public fromJSON(data: ShipJSON): void {
		super.fromJSON(data);
		assignWithDefaults(this, pick(data, 'type', 'hp', 'jumpCooldown'));
		this.storage.fromJSON(data.storage);
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
