import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { assignWithDefaults, pick, randomInt, type WithRequired } from 'utilium';
import { Container } from '../components/storage';
import { genericHardpoints } from '../generic/hardpoints';
import type { GenericShip, ShipType } from '../generic/ships';
import { genericShips } from '../generic/ships';
import type { System } from '../system';
import { randomInSphere } from '../utils';
import type { EntityJSON } from './entity';
import { Entity } from './entity';
import type { HardpointJSON } from './hardpoint';
import { Hardpoint } from './hardpoint';

export interface ShipJSON extends WithRequired<EntityJSON, 'storage'> {
	type: ShipType;
	hp: number;
	jumpCooldown: number;
	hardpoints: HardpointJSON[];
}

export class Ship extends Entity {
	public hardpoints: Set<Hardpoint> = new Set();
	public hp: number;
	public jumpCooldown: number;

	public isTargetable = true;

	/**
	 * @todo move distance related stuff to ship creation (i.e. shipyard)
	 */
	constructor(
		id: string | undefined,
		system: System,
		public type: ShipType
	) {
		super(id, system);

		const { power, hp, jump, storage, hardpoints } = genericShips.get(this.type)!;

		this.position.addInPlace(randomInSphere(Math.log(randomInt(0, power || 1) ** 3 + 1), true));

		this._storage = new Container(storage);
		this.hp = hp;
		this.jumpCooldown = jump.cooldown;

		for (const info of hardpoints) {
			if (!Object.hasOwn(genericHardpoints, info.type)) {
				console.warn('Hardpoint type does not exist (skipping): ' + info.type);
				continue;
			}

			const hardpoint = new Hardpoint(undefined, this.system, info);
			hardpoint.parent = this;
			this.hardpoints.add(hardpoint);
		}
	}

	public update() {
		super.update();
		this.velocity.scaleInPlace(0.9);
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
			const target = targets.reduce((previous: Entity | null, current) => {
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
				void hardpoint.fire(targetPoint);
			}
		}
		this.jumpCooldown = Math.max(--this.jumpCooldown, 0);
	}

	public get generic(): GenericShip {
		return genericShips.get(this.type)!;
	}

	public remove() {
		super.remove();
		this.owner?.fleet?.delete(this);
	}

	public jumpTo(targetSystem: System): boolean {
		if (this.jumpCooldown) {
			return false;
		}

		if (Vector2.Distance(this.system.position, targetSystem.position) > this.generic.jump.range) {
			return false;
		}

		this.system = targetSystem;
		this.jumpCooldown = +this.generic.jump.cooldown;
		return true;
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
		if (!genericShips.has(data.type)) {
			throw new ReferenceError('Ship type does not exist: ' + data.type);
		}
		assignWithDefaults(this as Ship, pick(data, 'type', 'hp', 'jumpCooldown'));
		this.storage.fromJSON(data.storage);
		this.owner?.fleet?.add(this);
	}

	public static FromJSON(data: EntityJSON, system: System): Ship;
	public static FromJSON(data: ShipJSON, system: System): Ship {
		const entity = new this(data.id, system, data.type);
		entity.fromJSON(data);
		return entity;
	}
}

export function generateFleetFromPower(power: number): ShipType[] {
	//enemy spawning algorithm
	const fleet: ShipType[] = [],
		generic = [...Object.entries(genericShips)] as [ShipType, GenericShip][];
	generic.sort((a, b) => b[1].power - a[1].power); //decending
	for (const [name, ship] of generic) {
		for (let i = 0; i < Math.floor(power / ship.power); i++) {
			fleet.push(name);
			power -= ship.power;
		}
	}
	return fleet;
}
