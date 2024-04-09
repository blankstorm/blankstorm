import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';
import type { StationJSON } from '../../core/stations/station';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';
import { StationPartRenderer } from './StationPart';

export class StationRenderer extends TransformNode implements Renderer<StationJSON> {
	components: StationPartRenderer[] = [];
	core: StationPartRenderer;

	constructor(id: string, scene: Scene) {
		super(id, scene);
	}

	async update({ name, position, rotation, parent }: StationJSON) {
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
entityRenderers.set('Station', StationRenderer);
