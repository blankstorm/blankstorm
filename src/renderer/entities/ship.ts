import type { ShipJSON } from '~/core/entities/ship';
import type { GenericShip, ShipType } from '~/core/generic/ships';
import { genericShips } from '~/core/generic/ships';
import { ModelRenderer } from '../models';
import { renderers } from './entity';
import { HardpointRenderer } from './hardpoint';

export class ShipRenderer extends ModelRenderer {
	public hardpoints: Map<string, HardpointRenderer> = new Map();
	public type!: ShipType;

	public readonly generic: GenericShip;

	public constructor(data: ShipJSON) {
		super(data);
		this.generic = genericShips.get(this.type)!;
	}

	public async update(data: ShipJSON) {
		await super.update(data);
		for (const hardpointData of [...data.hardpoints]) {
			if (this.hardpoints.has(hardpointData.id)) {
				this.hardpoints.get(hardpointData.id)!.update(hardpointData);
			} else {
				const hardpoint = new HardpointRenderer(hardpointData);
				await hardpoint.update(hardpointData);
				hardpoint.parent = this;
				this.hardpoints.set(hardpoint.id, hardpoint);
			}
		}
	}
}
renderers.set('Ship', ShipRenderer);
