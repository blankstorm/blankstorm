import type { HardpointJSON } from '../../core/entities/hardpoints';
import { genericHardpoints, type GenericHardpoint, type HardpointType } from '../../core/generic/hardpoints';
import { ModelRenderer } from '../models';
import { renderers } from './entity';

export class HardpointRenderer extends ModelRenderer<HardpointJSON> {
	declare public modelID: HardpointType;

	protected generic: GenericHardpoint;

	public constructor(data: HardpointJSON) {
		super(data);
		this.generic = genericHardpoints[data.type];
		this.instance.scaling.setAll(data.scale);
		this.instance.scalingDeterminant = data.scale;
	}
}
renderers.set('Hardpoint', HardpointRenderer);
