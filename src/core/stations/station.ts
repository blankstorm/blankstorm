import type { Level } from '../level';
import type { CelestialBodyJSON } from '../entities/body';
import { CelestialBody } from '../entities/body';
import type { Player } from '../entities/player';
import { StationPartJSON, StationPart } from './part';

export interface StationJSON extends CelestialBodyJSON {
	type: string;
	components: StationPartJSON;
}

export class Station extends CelestialBody {
	public parts: StationPart[] = [];
	public readonly core: StationPart;

	public isTargetable = true;
	declare owner?: CelestialBody | Player;
	public constructor(id: string, level: Level, options: ConstructorParameters<typeof CelestialBody>[2]) {
		super(id, level, options);

		this.core = new StationPart(null, level, { type: 'core' });
		this.core.station = this.core.parent = this;
	}

	public toJSON() {
		return Object.assign(super.toJSON(), {
			id: this.id,
			components: this.core.toJSON(),
		});
	}

	/**
	 * @todo actually implement
	 */
	public static FromJSON(data: StationJSON, level: Level): Station {
		return <Station>super.FromJSON(data, level, {});
	}
}
