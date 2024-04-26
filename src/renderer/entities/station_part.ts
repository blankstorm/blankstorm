import type { Scene } from '@babylonjs/core/scene';
import type { StationPartJSON } from '../../core/stations/part';
import { ModelRenderer } from '../models';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';

export class StationPartRenderer extends ModelRenderer implements Renderer<StationPartJSON> {
	public constructor(id: string, scene: Scene) {
		super(id, scene);
	}
}
StationPartRenderer satisfies RendererStatic<StationPartRenderer>;
entityRenderers.set('StationPart', StationPartRenderer);
