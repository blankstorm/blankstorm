import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { StationJSON } from '~/core/entities/station';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';
import type { StationPartRenderer } from './station/part';

export class StationRenderer extends TransformNode implements Renderer<StationJSON> {
	public components: StationPartRenderer[] = [];
	public core: StationPartRenderer;

	public async update({ name, position, rotation, parent }: StationJSON) {
		this.name = name;
		this.position = Vector3.FromArray(position);
		this.rotation = Vector3.FromArray(rotation);
		const _parent = parent ? this.getScene().getNodeById(parent) : null;
		if (_parent != this.parent) {
			this.parent = _parent;
		}
	}
}
StationRenderer satisfies RendererStatic<StationRenderer>;
entityRenderers.set('Station', StationRenderer);
