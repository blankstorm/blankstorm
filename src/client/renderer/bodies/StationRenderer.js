import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import StationComponentRenderer from './StationComponentRenderer.js';

export default class StationRenderer extends TransformNode {
	components = [];

	constructor(id, scene) {
		super(id, scene);

		this.core = new StationComponentRenderer(id + ':core', this);
		this.core.parent = this;
	}

	async update({ name, position, rotation } = {}){
		this.name = name;
		this.position = Vector3.FromArray(position);
		this.rotation = Vector3.FromArray(rotation);
	}

	static async FromData(data, scene) {
		const station = new this(data.id, scene);
		await station.update();
		return station;

	}
}
