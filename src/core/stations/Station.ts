import { CelestialBody } from '../nodes/CelestialBody';
import { SerializedStationComponent, StationComponent } from './StationComponent';
import type { SerializedCelestialBody } from '../nodes/CelestialBody';
import type { System } from '../System';
import type { Player } from '../nodes/Player';

export interface SerializedStation extends SerializedCelestialBody {
	type: string;
	components: SerializedStationComponent;
}

export class Station extends CelestialBody {
	components: StationComponent[] = [];
	#core: StationComponent;

	isTargetable = true;
	declare owner?: CelestialBody | Player;
	constructor(id: string, system: System, options: ConstructorParameters<typeof CelestialBody>[2]) {
		super(id, system, options);

		this.#core = new StationComponent(null, system, { type: 'core' });
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
	static FromJSON(data: SerializedStation, system: System): Station {
		return <Station>super.FromJSON(data, system, {});
	}
}
