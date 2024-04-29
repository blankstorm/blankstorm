import { assignWithDefaults, pick } from 'utilium';
import type { FleetJSON } from '../components/fleet';
import { Fleet } from '../components/fleet';
import type { EntityStorageManager } from '../components/storage';
import type { ResearchID } from '../generic/research';
import { research } from '../generic/research';
import type { EntityJSON } from './entity';
import { Entity } from './entity';

export interface PlayerJSON extends EntityJSON {
	research: Record<ResearchID, number>;
	fleet: FleetJSON;
	xp: number;
}

export class Player extends Entity {
	public research = <Record<ResearchID, number>>Object.fromEntries(Object.keys(research).map((k: ResearchID) => [k, 0]));
	public fleet: Fleet = new Fleet(this);
	public xp = 0;
	public get power(): number {
		return this.fleet.power;
	}

	public get storage(): EntityStorageManager {
		return this.fleet.storage;
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

	public fromJSON(data: PlayerJSON): void {
		super.fromJSON(data);
		assignWithDefaults(this, pick(data, 'xp', 'research'));
		this.research = data.research;
		if ('fleet' in data) {
			this.fleet.owner = this;
			this.fleet.fromJSON(data.fleet);
		}
	}

	public toJSON(): PlayerJSON {
		return {
			...super.toJSON(),
			...pick(this, 'xp', 'research'),
			fleet: this.fleet.toJSON(),
		};
	}
}
