import { Component, registerComponent } from 'deltablank/core/component.js';
import { entityRegistry, type EntityJSON } from 'deltablank/core/entity.js';
import type { UUID } from 'utilium';
import type { Ship, ShipType } from '../entities/ships';
import { logger } from '../utils';

export interface FleetJSON {
	name?: string;
	elements: (FleetJSON | UUID)[];
}

@registerComponent
export class Fleet extends Component<{ fleet: Fleet }, { fleet: FleetJSON }, { fleet: { max_ships: number; allow_nesting: boolean } }> {
	public name?: string;

	public get power(): number {
		let total = 0;
		for (const ship of this) {
			total += ship.constructor.config.power ?? 1;
		}
		return total;
	}

	setup(): { fleet: Fleet } {
		return { fleet: this };
	}

	dispose(): void | Promise<void> {
		this.ships.clear();
	}

	protected ships: Set<Ship> = new Set();

	public get size() {
		return this.ships.size;
	}

	public add(value: Ship): this {
		value.owner = this.entity;
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
			const ship = new entityRegistry[type](undefined, this.entity.level) as Ship;
			ship.system = this.entity.system;
			this.add(ship);
		}
	}

	public toJSON(): { fleet: FleetJSON } {
		return {
			fleet: {
				name: this.name,
				elements: Array.from(this).map(s => s.id),
			},
		};
	}

	public load(data: EntityJSON & { fleet: FleetJSON }) {
		for (const element of data.fleet.elements) {
			if (typeof element != 'string') {
				logger.warn('Nested fleets are not supported yet. (skipping fleet element)');
				continue;
			}

			this.add(this.entity.level.getEntityByID<Ship>(element));
		}
		// Note: Ship loaded after Fleet
	}
}
