import type { EntityStorageManager } from '../storage';
import type { FleetJSON } from '../fleet';
import { Fleet } from '../fleet';
import type { ResearchID } from '../generic/research';
import { research } from '../generic/research';
import type { Level } from '../level';
import type { EntityJSON } from './entity';
import { Entity } from './entity';
import type { ShipJSON } from './ship';
import { Ship } from './ship';
import { Vector3 } from '@babylonjs/core';
import type { ShipType } from '../generic/ships';

export interface PlayerJSON extends EntityJSON {
	research: Record<ResearchID, number>;
	fleet: FleetJSON;
	xp: number;
}

export class Player extends Entity {
	public research = <Record<ResearchID, number>>Object.fromEntries(Object.keys(research).map((k: ResearchID) => [k, 0]));
	public fleet: Fleet = new Fleet();
	public xp = 0;
	public get power(): number {
		return this.fleet.power;
	}

	public get storage(): EntityStorageManager {
		return this.fleet.storage;
	}

	public constructor(id: string, level: Level, fleet: (ShipJSON | Ship | ShipType)[]) {
		super(id, level);
		this.fleet.position = Vector3.Zero();
		for (const shipData of fleet) {
			const ship = shipData instanceof Ship ? shipData : typeof shipData == 'string' ? level.getEntityByID<Ship>(shipData) : Ship.From(shipData, level);
			ship.owner = this;
			ship.position.addInPlace(this.absolutePosition);
			this.fleet.add(ship);
		}
		setTimeout(() => level.emit('player_created', this.toJSON()));
	}

	public reset() {
		this.fleet.storage.clear();
		for (const type of Object.keys(research)) {
			this.research[type] = 0;
		}
		for (const ship of this.fleet) {
			ship.remove();
		}
		this.level.emit('player_reset', this.toJSON());
	}

	public remove() {
		this.level.emit('player_removed', this.toJSON());
		super.remove();
	}

	public from(data: PlayerJSON, level: Level): void {
		super.from(data, level);
		this.xp = data.xp;
		this.research = data.research;
		if ('fleet' in data) {
			this.fleet.from(data.fleet);
		}
	}

	public toJSON(): PlayerJSON {
		return {
			...super.toJSON(),
			fleet: this.fleet.toJSON(),
			xp: this.xp,
			research: this.research,
		};
	}
}
