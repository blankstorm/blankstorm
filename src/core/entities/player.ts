import { assignWithDefaults, pick } from 'utilium';
import { Fleet } from '../components/fleet';
import type { EntityStorageManager } from '../components/storage';
import type { ResearchID } from '../generic/research';
import { research } from '../generic/research';
import type { EntityJSON } from './entity';
import { Entity } from './entity';

export interface PlayerJSON extends EntityJSON {
	research: Record<ResearchID, number>;
	fleet: string;
	xp: number;
}

export class Player extends Entity {
	public research = Object.fromEntries(Object.keys(research).map(k => [k, 0])) as Record<ResearchID, number>;
	public fleet: Fleet;
	public xp = 0;
	public get power(): number {
		return this.fleet.power;
	}

	public get owner(): this {
		return this;
	}

	public get storage(): EntityStorageManager {
		return this.fleet.storage;
	}

	public update(): void {
		super.update();
		if (!this.fleet) {
			this.fleet = new Fleet(undefined, this.level);
			this.fleet.parent = this;
		}
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

	public fromJSON(data: PlayerJSON): void {
		super.fromJSON(data);
		assignWithDefaults(this as Player, pick(data, 'xp', 'research'));
		// Note: Fleet loaded after Player
	}

	public toJSON(): PlayerJSON {
		return {
			...super.toJSON(),
			...pick(this, 'xp', 'research'),
			fleet: this.fleet.id,
		};
	}
}
