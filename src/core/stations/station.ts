import type { Level } from '../level';
import type { CelestialBodyJSON } from '../entities/body';
import { CelestialBody } from '../entities/body';
import type { Player } from '../entities/player';
import type { StationPartJSON } from './part';
import { StationPart } from './part';
import { pick } from 'utilium';

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
		return {
			...super.toJSON(),
			...pick(this, 'id'),
			components: this.core.toJSON(),
		};
	}

	/**
	 * @todo Implement
	 */
	public fromJSON(data: StationJSON, level: Level): void {
		super.fromJSON(data, level);
	}
}
