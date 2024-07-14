import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';
import type { EntityJSON } from '~/core/entities/entity';
import type { Renderer, RendererStatic } from './renderer';

export class EntityRenderer extends TransformNode implements Renderer<EntityJSON> {
	public velocity: Vector3 = Vector3.Zero();

	public constructor(name: string, scene: Scene) {
		super(name, scene);
		this.position = Vector3.Zero();
		this.rotation = Vector3.Zero();
	}

	public async update({ name, position, rotation, velocity, parent }: EntityJSON) {
		this.name = name;
		this.position = Vector3.FromArray(position);
		this.rotation = Vector3.FromArray(rotation);
		this.velocity = Vector3.FromArray(velocity);
		this.parent = parent ? this.getScene().getNodeById(parent) : null;
	}
}

EntityRenderer satisfies RendererStatic<EntityRenderer>;
