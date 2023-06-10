import type { Scene } from '@babylonjs/core/scene';
import { HardpointRenderer } from './Hardpoint';
import { ModelRenderer } from '../Model';
import { ShipType, genericShips } from '../../core/generic/ships';
import type { SerializedShip } from '../../core/nodes/Ship';
import type { Renderer } from './Renderer';

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
				const hardpoint = await HardpointRenderer.FromData(hardpointData, this.getScene());
				hardpoint.parent = this;
				this.hardpoints.set(hardpoint.id, hardpoint);
			}
		}
	}

	static async FromData(data: SerializedShip, scene: Scene) {
		const ship = new this(data.id, scene);
		await ship.update(data);
		return ship;
	}
}
