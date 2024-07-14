import type { StationPartJSON } from '~/core/entities/station/part';
import { ModelRenderer } from '../../models';
import { entityRenderers, type Renderer, type RendererStatic } from '../renderer';

export class StationPartRenderer extends ModelRenderer implements Renderer<StationPartJSON> {}
StationPartRenderer satisfies RendererStatic<StationPartRenderer>;
entityRenderers.set('StationPart', StationPartRenderer);
