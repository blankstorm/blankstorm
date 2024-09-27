import { pick } from 'utilium';
import type { System } from '../system';
import type { CelestialBodyJSON } from './body';
import { CelestialBody } from './body';
import type { StationPartJSON } from './station/part';
import { StationPart } from './station/part';

export interface StationJSON extends CelestialBodyJSON {
	parts: StationPartJSON[];
}

export class Station extends CelestialBody {
	public parts: Set<StationPart> = new Set();
	public readonly core: StationPart;

	public isTargetable = true;
	public constructor(id: string | undefined, system: System) {
		super(id, system);

		this.core = new StationPart(undefined, system);
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
