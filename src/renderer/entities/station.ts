import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';
import type { StationJSON } from '../../core/stations/station';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';
import type { StationPartRenderer } from './station_part';

export class StationRenderer extends TransformNode implements Renderer<StationJSON> {
	public components: StationPartRenderer[] = [];
	public core: StationPartRenderer;

	public constructor(id: string, scene: Scene) {
		super(id, scene);
	}

	public async update({ name, position, rotation, parent }: StationJSON) {
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
