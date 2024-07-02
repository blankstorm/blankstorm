import type { Scene } from '@babylonjs/core/scene';
import type { ShipJSON } from '../../core/entities/ship';
import type { ShipType } from '../../core/generic/ships';
import { genericShips } from '../../core/generic/ships';
import { ModelRenderer } from '../models';
import { HardpointRenderer } from './hardpoint';
import { createAndUpdate, entityRenderers, type Renderer, type RendererStatic } from './renderer';

export class ShipRenderer extends ModelRenderer implements Renderer<ShipJSON> {
	public hardpoints: Map<string, HardpointRenderer> = new Map();
	public type: ShipType;

	public constructor(id: string, scene: Scene) {
		super(id, scene);
	}

	public override get generic() {
		return genericShips[this.type];
	}

	public async update(data: ShipJSON) {
		await super.update(data);
		for (const hardpointData of [...data.hardpoints]) {
			if (this.hardpoints.has(hardpointData.id)) {
				this.hardpoints.get(hardpointData.id)!.update(hardpointData);
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
