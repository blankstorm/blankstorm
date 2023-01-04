import { random } from '../utils.js';
import CelestialBody from './CelestialBody.js';
import StationComponent from '../StationComponent.js';


const Station = class extends CelestialBody {
	components = [];
	#core;
	#level;

	constructor({ name = 'Station', id = random.hex(32) }, level) {
		super(name, id, level);

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

export default Station;