import type { StationJSON } from '~/core/entities/station';
import type { ModelRenderer } from '../models';
import { EntityRenderer, renderers, type Renderer } from './entity';

export class StationRenderer extends EntityRenderer implements Renderer<StationJSON> {
	public components: ModelRenderer[] = [];
	public core!: ModelRenderer;

	// TODO: Implement
}
renderers.set('Station', StationRenderer);
