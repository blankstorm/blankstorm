import type { HardpointJSON } from '../../core/entities/hardpoint.js';
import { genericHardpoints, type GenericHardpoint, type HardpointType } from '../../core/generic/hardpoints.js';
import { ModelRenderer } from '../models.js';
import { renderers } from './entity.js';

export class HardpointRenderer extends ModelRenderer<HardpointJSON> {
	public declare modelID: HardpointType;

	protected generic: GenericHardpoint;

	public constructor(data: HardpointJSON) {
		super(data);
		this.generic = genericHardpoints[data.type];
		this.instance.scaling.setAll(data.scale);
		this.instance.scalingDeterminant = data.scale;
	}
}
renderers.set('Hardpoint', HardpointRenderer);
