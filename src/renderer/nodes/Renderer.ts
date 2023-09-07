import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';
import type { SerializedNode } from '../../core/nodes/Node';

export declare class Renderer<S extends SerializedNode> extends TransformNode {
	update(s: S): Promise<void>;
	static FromJSON<S extends SerializedNode>(s: S, scene: Scene): Promise<Renderer<S>>;
}
