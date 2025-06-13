import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Component, registerComponent } from 'deltablank/core/component.js';
import type { EntityJSON } from 'deltablank/core/entity.js';

@registerComponent
export class Velocity extends Component<{ velocity: Vector3 }, { velocity: [number, number, number] }> {
	setup(): { velocity: Vector3 } | Promise<{ velocity: Vector3 }> {
		return { velocity: Vector3.Zero() };
	}

	load(data: EntityJSON & { velocity: [number, number, number] }): void {
		this.entity.velocity = Vector3.FromArray(data.velocity);
	}

	tick(): void {
		this.entity.position.addInPlace(this.entity.velocity);
		this.entity.velocity.scaleInPlace(0.9);
	}

	toJSON(): { velocity: [number, number, number] } {
		return {
			velocity: this.entity.velocity.asArray(),
		};
	}
}
