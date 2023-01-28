import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';

export default class PlayerRenderer extends TransformNode {
	velocity = Vector3.Zero();

	constructor({ id, name, position, rotation }, scene) {
		super(id, scene);
		this.name = name;
		this.position = position;
		this.rotation = rotation;
	}

	addVelocity(vector = Vector3.Zero(), computeMultiplyer) {
		let direction = this.camera.getDirection(vector).scale(1 / Math.PI);
		direction.y = 0;
		direction.normalize();
		if (computeMultiplyer) direction.scaleInPlace(this.speed + this.tech.thrust / 10);
		this.velocity.addInPlace(direction);
	}

	static FromData(data, scene) {
		return new this(
			{
				id: data.id,
				name: data.name,
				position: Vector3.FromArray(data.position || [0, 0, 0]),
				rotation: Vector3.FromArray(data.rotation || [0, 0, 0]),
			},
			scene
		);
	}
}
