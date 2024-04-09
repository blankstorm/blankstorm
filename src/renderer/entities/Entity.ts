import type { Scene } from '@babylonjs/core/scene';
import type { EntityJSON } from '../../core';
import { ModelRenderer } from '../models';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';

export class EntityRenderer extends ModelRenderer implements Renderer<EntityJSON> {
	constructor(id: string, scene: Scene) {
		super(id, scene);
	}
}
EntityRenderer satisfies RendererStatic<EntityRenderer>;
entityRenderers.set('Entity', EntityRenderer);
