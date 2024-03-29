import { Fleet, FleetData } from '../fleet';
import type { ResearchID } from '../generic/research';
import { research } from '../generic/research';
import type { Level } from '../level';
import type { SerializedEntity } from './entity';
import { Entity } from './entity';
import type { SerializedShip } from './ship';
import { Ship } from './ship';

export interface SerializedPlayer extends SerializedEntity {
	research: Record<ResearchID, number>;
	fleet: FleetData;
	xp: number;
	xpPoints: number;
}

export class Player extends Entity {
	research = <Record<ResearchID, number>>Object.fromEntries(Object.keys(research).map((k: ResearchID) => [k, 0]));
	fleet: Fleet;
	xp = 0;
	xpPoints = 0;
	speed = 1;
	oplvl?: number;
	get power(): number {
		return this.fleet.power;
	}

	constructor(id: string, level: Level, { fleet }: { fleet: (SerializedShip | Ship | string)[] }) {
		super(id, level);
		for (const shipData of fleet) {
			const ship = shipData instanceof Ship ? shipData : typeof shipData == 'string' ? level.getEntityByID<Ship>(shipData) : Ship.FromJSON(shipData, level);
			ship.owner = this;
			ship.position.addInPlace(this.absolutePosition);
			this.fleet.add(ship);
		}
		setTimeout(() => level.emit('player_created', this.toJSON()));
	}

	reset() {
		this.fleet.removeAllItems();
		for (const type of Object.keys(research)) {
			this.research[type] = 0;
		}
		for (const ship of this.fleet) {
			ship.remove();
		}
		this.level.emit('player_reset', this.toJSON());
	}

	remove() {
		this.level.emit('player_removed', this.toJSON());
		super.remove();
	}

	toJSON(): SerializedPlayer {
		return Object.assign(super.toJSON(), {
			fleet: this.fleet.toJSON(),
			xp: this.xp,
			xpPoints: this.xpPoints,
			research: this.research,
		});
	}

	static FromJSON(data: SerializedPlayer, level: Level): Player {
		return <Player>super.FromJSON(data, level, data);
	}
}
