import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';

import { StationComponentRenderer } from './StationComponent';
import type { SerializedStation } from '../../core';
import { nodeMap, type Renderer, type RendererStatic } from './renderer';

export class StationRenderer extends TransformNode implements Renderer<SerializedStation> {
	components: StationComponentRenderer[] = [];
	core: StationComponentRenderer;

	constructor(id: string, scene: Scene) {
		super(id, scene);
	}

	async update({ name, position, rotation, parent }: SerializedStation) {
		this.name = name;
		this.position = Vector3.FromArray(position);
		this.rotation = Vector3.FromArray(rotation);
		const _parent = this.getScene().getNodeById(parent);
		if (_parent != this.parent) {
			this.parent = _parent;
		}
	}
}
StationRenderer satisfies RendererStatic<StationRenderer>;
nodeMap.set('Station', StationRenderer);
