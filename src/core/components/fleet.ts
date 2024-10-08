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
export class Fleet extends Entity {
	protected _storage = new EntityStorageManager(this);

	public get storage(): EntityStorageManager {
		return this._storage;
	}

	public get power(): number {
		let total = 0;
		for (const ship of this) {
			total += ship.generic.power;
		}
		return total;
	}

	protected ships: Set<Ship> = new Set();

	declare parent: CelestialBody | Player;

	public get owner(): CelestialBody | Player {
		return this.parent;
	}

	public set owner(value: CelestialBody | Player) {
		this.parent = value;
	}

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

	[Symbol.iterator](): IterableIterator<Ship> {
		return this.ships[Symbol.iterator]();
	}

	public at(index: number): Ship {
		if (Math.abs(index) >= this.size) {
			throw new ReferenceError('Invalid index in fleet: ' + index);
		}

		return [...this].at(index)!;
	}

	public addFromStrings(...types: ShipType[]): void {
		for (const type of types) {
			const ship = new Ship(undefined, this.system, type);
			ship.system = this.system;
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
		this.owner.fleet.remove();
		this.owner.fleet = this;
		// Note: Ship loaded after Fleet
	}
}
