import type { ArcRotateCameraPointersInput } from '@babylonjs/core/Cameras/Inputs/arcRotateCameraPointersInput';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import config from './config';

export class Camera extends ArcRotateCamera {
	velocity = Vector3.Zero();

	constructor(scene: Scene) {
		super('camera', -Math.PI / 2, Math.PI / 2, 5, Vector3.Zero(), scene);
		scene.activeCamera = this;
		(this.inputs.attached.pointers as ArcRotateCameraPointersInput).buttons = [1];
		Object.assign(this, config.player_camera);

		scene.registerBeforeRender(() => {
			this.target.addInPlace(this.velocity);
			this.velocity.scaleInPlace(0.9);
		});
	}

	reset() {
		this.alpha = -Math.PI / 2;
		this.beta = Math.PI / 2;
		this.velocity = Vector3.Zero();
	}

	addVelocity(vector = Vector3.Zero()) {
		const direction = this.getDirection(vector).scale(1 / Math.PI);
		direction.y = 0;
		direction.normalize();
		this.velocity.addInPlace(direction);
	}
}
