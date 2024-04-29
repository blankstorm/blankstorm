import type { Level } from '../level';
import type { CelestialBodyJSON } from '../entities/body';
import { CelestialBody } from '../entities/body';
import type { Player } from '../entities/player';
import type { StationPartJSON } from './part';
import { StationPart } from './part';
import { pick } from 'utilium';

export interface StationJSON extends CelestialBodyJSON {
	parts: StationPartJSON[];
}

export class Station extends CelestialBody {
	public parts: Set<StationPart> = new Set();
	public readonly core: StationPart;

	public isTargetable = true;
	declare owner?: CelestialBody | Player;
	public constructor(id: string, level: Level) {
		super(id, level);

		this.core = new StationPart(null, level);
		this.core.type = 'core';
		this.core.station = this.core.parent = this;
	}

	public toJSON(): StationJSON {
		return {
			...super.toJSON(),
			...pick(this, 'id'),
			parts: [...this.parts].map(part => part.toJSON()),
		};
	}

	/**
	 * @todo Implement
	 * This includes rebuilding the part connections.
	 */
	public fromJSON(data: StationJSON): void {
		super.fromJSON(data);
	}
}
