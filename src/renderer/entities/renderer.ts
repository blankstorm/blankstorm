import type { Scene } from '@babylonjs/core/scene';
import type { SerializedEntity } from '../../core/entities/Entity';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';

export interface Renderer<S extends SerializedEntity = SerializedEntity> extends TransformNode {
	update(s: S): Promise<void>;
}

export type RendererData<R> = R extends Renderer<infer S> ? S : never;

export interface RendererStatic<R extends Renderer = Renderer> {
	new (id: string, scene: Scene): R;
}

export async function createAndUpdate<R extends Renderer>(Renderer: RendererStatic<R>, data: RendererData<R>, scene: Scene): Promise<R> {
	const renderer = new Renderer(data.id, scene);
	await renderer.update(data);
	return renderer;
}

export const entityRenderers: Map<string, RendererStatic> = new Map();
