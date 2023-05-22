import type { SerializedStationComponent } from '../../core';
import type { Scene } from '@babylonjs/core/scene';
import { ModelRenderer } from '../Model';

export class StationComponentRenderer extends ModelRenderer {
	constructor(id: string, scene: Scene) {
		super(id, scene);
	}

	static async FromData(data: SerializedStationComponent, scene: Scene) {
		const component = new this(data.id, scene);
		await component.update(data);
		return component;
	}
}
