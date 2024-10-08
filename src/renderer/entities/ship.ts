import type { ShipJSON } from '../../core/entities/ship';
import type { GenericShip } from '../../core/generic/ships';
import { genericShips } from '../../core/generic/ships';
import { ModelRenderer } from '../models';
import { renderers } from './entity';

export class ShipRenderer extends ModelRenderer {
	public readonly generic: GenericShip;

	public constructor(data: ShipJSON) {
		super(data);
		this.generic = genericShips.get(data.type)!;
	}
}
renderers.set('Ship', ShipRenderer);
