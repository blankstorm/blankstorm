import type { Scene } from '@babylonjs/core/scene';
import type { ShipJSON } from '../../core/entities/ship';
import type { ShipType } from '../../core/generic/ships';
import { genericShips } from '../../core/generic/ships';
import { ModelRenderer } from '../models';
import { HardpointRenderer } from './hardpoint';
import { createAndUpdate, entityRenderers, type Renderer, type RendererStatic } from './renderer';

export class ShipRenderer extends ModelRenderer implements Renderer<ShipJSON> {
	hardpoints: Map<string, HardpointRenderer> = new Map();
	type: ShipType;

	constructor(id: string, scene: Scene) {
		super(id, scene);
	}

	override get generic() {
		return genericShips[this.type];
	}

	async update(data: ShipJSON) {
		await super.update(data);
		for (const hardpointData of [...data.hardpoints]) {
			if (this.hardpoints.has(hardpointData.id)) {
				this.hardpoints.get(hardpointData.id).update(hardpointData);
			} else {
				const hardpoint = await createAndUpdate(HardpointRenderer, hardpointData, this.getScene());
				hardpoint.parent = this;
				this.hardpoints.set(hardpoint.id, hardpoint);
			}
		}
	}
}
ShipRenderer satisfies RendererStatic<ShipRenderer>;
entityRenderers.set('Ship', ShipRenderer);
