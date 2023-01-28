import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import StationComponentRenderer from './StationComponentRenderer.js';

export default class StationRenderer extends TransformNode {
	components = [];

	constructor({ name = 'Station', id }, level) {
		super(name, id, level);

		this.core = new StationComponentRenderer('core', this);
		this.core.parent = this;
	}

	static FromData(data, scene) {
		return new this({
			id: data.id,
			position: Vector3.FromArray(data.position),
			rotation: Vector3.FromArray(data.rotation),
			scene,
		});
	}
}
