import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { CelestialBody } from '../entities/body';
import type { Player } from '../entities/player';
import type { Ship } from '../entities/ship';
import type { Level } from '../level';
import { register } from './component';
import { EntityStorageManager } from './storage';

export interface FleetJSON {
	position: number[];
	ships: string[];
}

@register
export class Fleet extends Set<Ship> {
	public owner: CelestialBody | Player;

	public storage = new EntityStorageManager(this);

	public get level(): Level {
		return this.owner.level;
	}

	public position: Vector3;

	public get power(): number {
		let total = 0;
		for (const ship of this) {
			total += ship.generic.power;
		}
		return total;
	}

	public toJSON(): FleetJSON {
		return {
			position: this.position.asArray(),
			ships: Array.from(this).map(s => s.id),
		};
	}

	public fromJSON({ position, ships }: FleetJSON): void {
		this.position = Vector3.FromArray(position || [0, 0, 0]);
		this.clear();
		for (const id of ships) {
			const ship = this.owner.level.getEntityByID<Ship>(id);
			ship.position.addInPlace(this.position);

			ship.parent = this.owner;
			ship.owner = this.owner;
			this.add(ship);
		}
	}

	public static FromJSON(data: FleetJSON): Fleet {
		const fleet = new Fleet();
		fleet.fromJSON(data);
		return fleet;
	}
}
