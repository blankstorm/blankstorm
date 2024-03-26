import type { Level } from '../Level';
import type { SerializedCelestialBody } from '../entities/CelestialBody';
import { CelestialBody } from '../entities/CelestialBody';
import type { Player } from '../entities/Player';
import { SerializedStationComponent, StationComponent } from './StationComponent';

export interface SerializedStation extends SerializedCelestialBody {
	type: string;
	components: SerializedStationComponent;
}

export class Station extends CelestialBody {
	components: StationComponent[] = [];
	#core: StationComponent;

	isTargetable = true;
	declare owner?: CelestialBody | Player;
	constructor(id: string, level: Level, options: ConstructorParameters<typeof CelestialBody>[2]) {
		super(id, level, options);

		this.#core = new StationComponent(null, level, { type: 'core' });
		this.#core.station = this.#core.parent = this;
	}

	get core() {
		return this.#core;
	}

	toJSON() {
		return Object.assign(super.toJSON(), {
			id: this.id,
			components: this.#core.toJSON(),
		});
	}

	/**
	 * @todo actually implement
	 */
	static FromJSON(data: SerializedStation, level: Level): Station {
		return <Station>super.FromJSON(data, level, {});
	}
}
