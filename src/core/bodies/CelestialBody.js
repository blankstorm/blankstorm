import { random } from '../utils.js';

export default class extends BABYLON.Mesh {
	fleet = [];
	owner = null;
	fleetLocation = BABYLON.Vector3.Zero();
	get power() {
		return this.fleet.reduce((total, ship) => total + ship._generic.power, 0) ?? 0;
	}
	constructor(name, id = random.hex(32), level) {
		//if (!(level instanceof Level)) throw new TypeError('level must be a Level'); Level not imported due to overhead
		super(name, level);
		this.id = id;
		level.bodies.set(id, this);
	}
	remove() {
		this.dispose();
		this.getScene().bodies.delete(this.id);
	}
}
