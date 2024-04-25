import type { ArcRotateCameraPointersInput } from '@babylonjs/core/Cameras/Inputs/arcRotateCameraPointersInput';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import { player_camera } from './config';

export class Camera extends ArcRotateCamera {
	velocity = Vector3.Zero();

	constructor(scene: Scene) {
		super('camera', -Math.PI / 2, Math.PI / 2, 5, Vector3.Zero(), scene);
		scene.activeCamera = this;
		(<ArcRotateCameraPointersInput>this.inputs.attached.pointers).buttons = [1];
		Object.assign(this, player_camera);

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
		const direction = this.getDirection(vector);
		direction.y = 0;
		direction.normalize().scaleInPlace(this.radius / 5);
		this.velocity.addInPlace(direction);
	}
}
