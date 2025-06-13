import { shipConfigs, type Ship, type ShipConfig, type ShipType } from '../../core/entities/ships';
import { ModelRenderer } from '../models';
import { renderers } from './entity';

export class ShipRenderer extends ModelRenderer {
	public readonly config: ShipConfig;

	public constructor(data: ReturnType<Ship['toJSON']>) {
		super(data);
		this.config = shipConfigs[data.type as ShipType];
	}
}
renderers.set('Ship', ShipRenderer);
