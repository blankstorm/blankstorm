import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { EntityJSON } from '~/core/entities/entity';

export interface Renderer<T extends EntityJSON = EntityJSON> {
	update(data: T): Promise<void>;
}

export type RendererJSON<R> = R extends Renderer<infer T extends EntityJSON> ? T : never;

export type JSONof<R> = R extends typeof EntityRenderer<infer T extends EntityJSON> ? T : never;

export class EntityRenderer<T extends EntityJSON = EntityJSON> extends TransformNode implements Renderer<T> {
	public velocity: Vector3 = Vector3.Zero();

	public constructor(data: EntityJSON) {
		super(data.name);
		this.position = Vector3.Zero();
		this.rotation = Vector3.Zero();
	}

	public async update({ name, position, rotation, velocity, parent }: EntityJSON): Promise<void> {
		this.name = name;
		this.position = Vector3.FromArray(position);
		this.rotation = Vector3.FromArray(rotation);
		this.velocity = Vector3.FromArray(velocity);
		this.parent = parent ? this.getScene().getNodeById(parent) : null;
	}
}

export const renderers: Map<string, typeof EntityRenderer> = new Map();
