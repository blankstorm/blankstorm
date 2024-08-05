import type { StationJSON } from '~/core/entities/station';
import type { ModelRenderer } from '../models';
import { EntityRenderer, renderers } from './entity';

export class StationRenderer extends EntityRenderer {
	public components: ModelRenderer[] = [];
	public core!: ModelRenderer;

	// TODO: Implement
}
renderers.set('Station', StationRenderer);
