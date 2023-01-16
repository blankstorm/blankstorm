import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.js';

import config from '../config.js';

export default class PlayerRenderer extends TransformNode {

	velocity = Vector3.Zero();
	camera = null;

	constructor({ id, name, position, rotation }, scene) {
		super(id, scene);
		this.position = position;
		this.rotation = rotation;
		this.camera = new ArcRotateCamera(id, -Math.PI / 2, Math.PI / 2, 5, Vector3.Zero(), scene);
		this.camera.parent = this;
		Object.assign(this.camera, config.player_camera);

	}

	addVelocity(vector = Vector3.Zero(), computeMultiplyer) {
		let direction = this.camera.getDirection(vector).scale(1 / Math.PI);
		direction.y = 0;
		direction.normalize();
		if (computeMultiplyer) direction.scaleInPlace(this.speed + this.tech.thrust / 10);
		this.velocity.addInPlace(direction);
	}

	static FromData(data, scene){
		return new this({
			id: data.id,
			name: data.name,
			position: Vector3.FromArray(data.position || [0, 0, 0]),
			rotation: Vector3.FromArray(data.rotation || [0, 0, 0]),
		}, scene);
	}
}
