import CelestialBody from './CelestialBody.js';
import StationComponent from './StationComponent.js';

export default class Station extends CelestialBody {
	components = [];
	#core;
	#level;

	isTargetable = true;

	constructor(id, level, options) {
		super(id, level, options);

		this.#level = level;
		this.#core = new StationComponent(null, level, {type: 'core', station: this});
		this.#core.parent = this;
	}

	get level() {
		return this.#level;
	}

	get core() {
		return this.#core;
	}

	serialize() {
		return Object.assign(super.serialize(), {
			id: this.id,
			components: this.#core.serialize(),
		});
	}

	/**
	 * @todo actually implement
	 */
	static FromData(data, level) {
		return super.FromData(data, level, data);
	}
}
