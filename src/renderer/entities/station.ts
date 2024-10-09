import type { StationJSON } from '../../core/entities/station.js';
import type { ModelRenderer } from '../models.js';
import { EntityRenderer, renderers } from './entity.js';

export class StationRenderer extends EntityRenderer<StationJSON> {
	public components: ModelRenderer[] = [];
	public core!: ModelRenderer;

	// TODO: Implement
}
renderers.set('Station', StationRenderer);
