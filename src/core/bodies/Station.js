import CelestialBody from './CelestialBody.js';
import StationComponent from './StationComponent.js';

export default class Station extends CelestialBody {
	components = [];
	#core;
	#level;

	isTargetable = true;

	constructor({ id, name = 'Station', level }) {
		super({ id, name, level });

		this.#level = level;
		this.#core = new StationComponent('core', this);
		this.#core.parent = this;
	}

	get level() {
		return this.#level;
	}

	get core() {
		return this.#core;
	}

	serialize() {
		return {
			id: this.id,
			components: this.#core.serialize(),
		};
	}

	remove() {}
}
