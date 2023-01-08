import { random } from '../utils.js';

import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';

export default class extends Mesh {
	fleet = [];
	owner = null;
	fleetLocation = Vector3.Zero();
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
