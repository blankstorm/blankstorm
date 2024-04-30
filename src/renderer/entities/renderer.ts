import type { Scene } from '@babylonjs/core/scene';
import type { EntityJSON } from '../../core/entities/entity';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';

export interface Renderer<T extends EntityJSON = EntityJSON> extends TransformNode {
	update(data: T): Promise<void>;
}

export type RendererJSON<R> = R extends Renderer<infer T> ? T : never;

export interface RendererStatic<R extends Renderer = Renderer> {
	new (id: string, scene: Scene): R;
}

export async function createAndUpdate<R extends Renderer>(Renderer: RendererStatic<R>, data: RendererJSON<R>, scene: Scene): Promise<R> {
	const renderer = new Renderer(data.id, scene);
	await renderer.update(data);
	return renderer;
}

export const entityRenderers: Map<string, RendererStatic> = new Map();
