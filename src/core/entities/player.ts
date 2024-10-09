import { assignWithDefaults, pick } from 'utilium';
import { Fleet } from '../components/fleet.js';
import type { EntityStorageManager } from '../components/storage.js';
import type { ResearchID } from '../generic/research.js';
import { research } from '../generic/research.js';
import type { System } from '../system.js';
import type { EntityJSON } from './entity.js';
import { Entity } from './entity.js';

export interface PlayerJSON extends EntityJSON {
	research: Record<ResearchID, number>;
	fleet: string;
	xp: number;
}

export class Player extends Entity {
	public research = Object.fromEntries([...research.keys()].map(k => [k, 0])) as Record<ResearchID, number>;
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

	public constructor(id: string | undefined, system: System) {
		super(id, system);
		this.fleet = new Fleet(undefined, system);
		this.fleet.parent = this;
	}

	public update(): void {
		this.velocity.scaleInPlace(0.9);
	}

	public reset(): void {
		this.fleet.storage.clear();
		for (const type of research.keys()) {
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
