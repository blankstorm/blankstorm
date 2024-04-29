import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { CelestialBody } from '../entities/body';
import type { Player } from '../entities/player';
import { Ship } from '../entities/ship';
import type { ShipType } from '../generic/ships';
import type { Level } from '../level';
import { register, type Component } from './component';
import { EntityStorageManager } from './storage';

export interface FleetJSON {
	owner: string;
	position: number[];
	ships: string[];
}

@register
export class Fleet extends Set<Ship> implements Component<FleetJSON> {
	public storage = new EntityStorageManager(this);

	public get level(): Level {
		return this.owner.level;
	}

	public position: Vector3 = Vector3.Zero();

	public get power(): number {
		let total = 0;
		for (const ship of this) {
			total += ship.generic.power;
		}
		return total;
	}

	public constructor(
		public owner?: CelestialBody | Player,
		values?: readonly Ship[] | Iterable<Ship> | null
	) {
		super(values);
	}

	public at(index: number): Ship {
		if (Math.abs(index) >= this.size) {
			throw new ReferenceError('Invalid index in fleet: ' + index);
		}

		return [...this].at(index);
	}

	public addFromStrings(...types: ShipType[]): void {
		for (const type of types) {
			const ship = new Ship(null, this.level, type);
			ship.parent = ship.owner = this.owner;
			this.add(ship);
		}
	}

	public toJSON(): FleetJSON {
		return {
			owner: this.owner?.id,
			position: this.position.asArray(),
			ships: Array.from(this).map(s => s.id),
		};
	}

	public fromJSON({ position, ships }: FleetJSON): void {
		this.position = Vector3.FromArray(position || [0, 0, 0]);
		this.clear();
		for (const id of ships) {
			const ship = this.owner.level.getEntityByID<Ship>(id);
			if (!ship) {
				throw new ReferenceError('Ship does not exist: ' + id);
			}
			ship.position.addInPlace(this.position);

			ship.parent = ship.owner = this.owner;
			this.add(ship);
		}
	}

	public static FromJSON(data: FleetJSON, level: Level): Fleet {
		const fleet = new Fleet();
		fleet.owner = level.getEntityByID(data.owner);
		fleet.fromJSON(data);
		return fleet;
	}
}
