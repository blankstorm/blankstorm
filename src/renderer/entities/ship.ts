import type { ShipJSON } from '../../core/entities/ship.js';
import type { GenericShip } from '../../core/generic/ships.js';
import { genericShips } from '../../core/generic/ships.js';
import { ModelRenderer } from '../models.js';
import { renderers } from './entity.js';

export class ShipRenderer extends ModelRenderer {
	public readonly generic: GenericShip;

	public constructor(data: ShipJSON) {
		super(data);
		this.generic = genericShips.get(data.type)!;
	}
}
renderers.set('Ship', ShipRenderer);
