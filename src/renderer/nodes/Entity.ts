import type { Scene } from '@babylonjs/core/scene';
import type { SerializedEntity } from '../../core';
import { ModelRenderer } from '../models';
import type { Renderer, RendererStatic } from './Renderer';

export class EntityRenderer extends ModelRenderer implements Renderer<SerializedEntity> {
	constructor(id: string, scene: Scene) {
		super(id, scene);
	}

	static async FromJSON(data: SerializedEntity, scene: Scene) {
		const entity = new this(data.id, scene);
		await entity.update(data);
		return entity;
	}
}
EntityRenderer satisfies RendererStatic<SerializedEntity>;
