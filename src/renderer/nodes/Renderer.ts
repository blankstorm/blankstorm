import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';
import type { SerializedNode } from '../../core/nodes/Node';

export interface Renderer<S extends SerializedNode> extends TransformNode {
	update(s: S): Promise<unknown>;
}

export interface RendererStatic<S extends SerializedNode> {
	FromData(s: S, scene: Scene): Promise<Renderer<S>>;
}
