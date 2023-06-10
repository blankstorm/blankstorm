import type { Scene } from '@babylonjs/core/scene';
import type { SerializedStationComponent } from '../../core';
import { ModelRenderer } from '../Model';
import type { Renderer } from './Renderer';

export class StationComponentRenderer extends ModelRenderer implements Renderer<SerializedStationComponent> {
	constructor(id: string, scene: Scene) {
		super(id, scene);
	}

	static async FromJSON(data: SerializedStationComponent, scene: Scene) {
		const component = new this(data.id, scene);
		await component.update(data);
		return component;
	}
}
