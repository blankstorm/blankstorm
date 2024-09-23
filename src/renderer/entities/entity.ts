import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { EntityJSON } from '~/core/entities/entity';

export class EntityRenderer<T extends EntityJSON = EntityJSON> extends TransformNode {
	public velocity: Vector3 = Vector3.Zero();

	public constructor(
		/**
		 * The data associated with this renderer.
		 * @internal
		 */
		public data: T
	) {
		super(data.name);
		this.position = Vector3.Zero();
		this.rotation = Vector3.Zero();
	}

	public async update(data: T): Promise<void> {
		this.data = data;
		this.name = data.name;
		this.position.fromArray(data.position);
		this.rotation.fromArray(data.rotation);
		this.velocity.fromArray(data.velocity);
		this.parent = data.parent ? this.getScene().getNodeById(data.parent) : null;
	}
}

export const renderers: Map<string, typeof EntityRenderer<EntityJSON>> = new Map();
