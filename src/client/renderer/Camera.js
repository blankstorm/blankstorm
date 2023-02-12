import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import config from './config.js';

export default class Camera extends ArcRotateCamera {
	velocity = Vector3.Zero();

	constructor(scene) {
		super('camera', -Math.PI / 2, Math.PI / 2, 5, Vector3.Zero(), scene);
		scene.activeCamera = this;
		this.inputs.attached.pointers.buttons = [1];
		Object.assign(this, config.player_camera);

		const _this = this;
		scene.registerBeforeRender(() => {
			_this.target.addInPlace(_this.velocity);
			_this.velocity.scaleInPlace(0.9);
		});
	}

	reset() {
		this.alpha = -Math.PI / 2;
		this.beta = Math.PI / 2;
		this.velocity = Vector3.Zero();
	}

	addVelocity(vector = Vector3.Zero()) {
		let direction = this.getDirection(vector).scale(1 / Math.PI);
		direction.y = 0;
		direction.normalize();
		this.velocity.addInPlace(direction);
	}
}
