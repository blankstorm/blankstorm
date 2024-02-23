import type { Scene } from '@babylonjs/core/scene';
import type { SerializedEntity } from '../../core';
import { ModelRenderer } from '../models';
import { nodeMap, type Renderer, type RendererStatic } from './renderer';

export class EntityRenderer extends ModelRenderer implements Renderer<SerializedEntity> {
	constructor(id: string, scene: Scene) {
		super(id, scene);
	}
}
EntityRenderer satisfies RendererStatic<EntityRenderer>;
nodeMap.set('Entity', EntityRenderer);
