import type { StationJSON } from '~/core/entities/station';
import type { ModelRenderer } from '../models';
import { EntityRenderer, renderers } from './entity';

export class StationRenderer extends EntityRenderer<StationJSON> {
	public components: ModelRenderer[] = [];
	public core!: ModelRenderer;

	// TODO: Implement
}
renderers.set('Station', StationRenderer);
