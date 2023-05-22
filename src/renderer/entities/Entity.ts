import type { SerializedEntity } from '../../core';
import { ModelRenderer } from '../Model';
import type { Scene } from '@babylonjs/core/scene';

export class EntityRenderer extends ModelRenderer {
	constructor(id: string, scene: Scene) {
		super(id, scene);
	}

	static async FromData(data: SerializedEntity, scene: Scene) {
		const entity = new this(data.id, scene);
		await entity.update(data);
		return entity;
	}
}
