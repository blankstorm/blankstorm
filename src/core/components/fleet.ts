import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { CelestialBody } from '../entities/body';
import { Entity, type EntityJSON } from '../entities/entity';
import type { Player } from '../entities/player';
import { Ship } from '../entities/ship';
import type { ShipType } from '../generic/ships';
import { register } from './component';
import { EntityStorageManager } from './storage';

export interface FleetJSON extends EntityJSON {
	ships: string[];
}

@register
export class Fleet extends Entity implements Set<Ship> {
	protected _storage = new EntityStorageManager(this);

	public get storage(): EntityStorageManager {
		return this._storage;
	}

	public position: Vector3 = Vector3.Zero();

	public get power(): number {
		let total = 0;
		for (const ship of this) {
			total += ship.generic.power;
		}
		return total;
	}

	public constructor(owner?: CelestialBody | Player) {
		super(null, owner.level);
		this.owner = owner;
		this.parent = owner;
		this.ships = new Set();
	}

	protected ships: Set<Ship> = new Set();

	public get size() {
		return this.ships.size;
	}

	public add(value: Ship): this {
		value.owner = this.owner;
		value.parent = this;
		this.ships.add(value);
		return this;
	}

	public clear(): void {
		this.ships.clear();
	}

	public delete(value: Ship): boolean {
		return this.ships.delete(value);
	}

	public has(value: Ship): boolean {
		return this.ships.has(value);
	}

	public forEach(cb: (value: Ship, value2: Ship, set: Set<Ship>) => void, thisArg?): void {
		this.ships.forEach(cb, thisArg);
	}

	public entries(): IterableIterator<[Ship, Ship]> {
		return this.ships.entries();
	}

	public keys(): IterableIterator<Ship> {
		return this.ships.keys();
	}

	public values(): IterableIterator<Ship> {
		return this.ships.values();
	}

	[Symbol.iterator](): IterableIterator<Ship> {
		return this.ships[Symbol.iterator]();
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
			this.add(ship);
		}
	}

	public toJSON(): FleetJSON {
		return {
			...super.toJSON(),
			ships: Array.from(this).map(s => s.id),
		};
	}

	public fromJSON(data: FleetJSON): void {
		super.fromJSON(data);
		this.clear();
		for (const id of data.ships) {
			const ship = this.owner.level.getEntityByID<Ship>(id);
			if (!ship) {
				throw new ReferenceError('Ship does not exist: ' + id);
			}
			this.add(ship);
		}
	}
}
