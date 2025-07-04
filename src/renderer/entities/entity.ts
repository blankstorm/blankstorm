import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { BS_EntityJSON } from '../../core/entities/.tmp.entity';

export class EntityRenderer<T extends BS_EntityJSON = BS_EntityJSON> extends TransformNode {
	public velocity: Vector3 = Vector3.Zero();

	public constructor(
		/**
		 * The data associated with this renderer.
		 * @internal
		 */
		public data: T
	) {
		super(data.name);
		this.id = data.id;
		this.position = Vector3.Zero();
		this.rotation = Vector3.Zero();
	}

	public update(data: T): void {
		if (this.id != data.id) {
			throw new Error(`ID mismatch while updating ${this.constructor.name} renderer: ${this.id} -> ${data.id}`);
		}
		this.data = data;
		this.name = data.name;
		this.position.fromArray(data.position);
		this.rotation.fromArray(data.rotation);
		this.velocity.fromArray(data.velocity);
		this.parent = data.parent ? this.getScene().getNodeById(data.parent) : null;
	}
}

export const renderers: Map<string, typeof EntityRenderer<BS_EntityJSON>> = new Map();
