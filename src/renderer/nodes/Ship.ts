import { HardpointRenderer } from './Hardpoint';
import { ModelRenderer } from '../models';
import { ShipType, genericShips } from '../../core/generic/ships';
import type { SerializedShip } from '../../core/nodes/Ship';
import { createAndUpdate, nodeMap, type Renderer, type RendererStatic } from './renderer';

export class ShipRenderer extends ModelRenderer implements Renderer<SerializedShip> {
	hardpoints: Map<string, HardpointRenderer> = new Map();
	type: ShipType;
	constructor(id, scene) {
		super(id, scene);
	}

	override get generic() {
		return genericShips[this.type];
	}

	async update(data: SerializedShip) {
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
nodeMap.set('Ship', ShipRenderer);
