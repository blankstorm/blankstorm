import { StationPart } from './StationPart';
import { Entity } from './Entity';
import type { Level } from '../Level';

export class Station extends Entity<{
	
}> {
	components: StationPart[] = [];
	#core: StationPart;

	isTargetable = true;

	constructor(id: string, level: Level, options) {
		super(id, level, options);

		this.#core = new StationPart(null, level, { type: 'core' });
		this.#core.station = this.#core.parent = this;
	}

	get core() {
		return this.#core;
	}

}
