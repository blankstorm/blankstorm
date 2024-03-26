import type { Scene } from '@babylonjs/core/scene';
import type { SerializedStationPart } from '../../core';
import { ModelRenderer } from '../models';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';

export class StationComponentRenderer extends ModelRenderer implements Renderer<SerializedStationPart> {
	constructor(id: string, scene: Scene) {
		super(id, scene);
	}
}
StationComponentRenderer satisfies RendererStatic<StationComponentRenderer>;
entityRenderers.set('StationComponent', StationComponentRenderer);
