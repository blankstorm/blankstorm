import type { FleetJSON } from '~/core/components/fleet';
import { EntityRenderer } from './entity';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';

export class FleetRenderer extends EntityRenderer implements Renderer<FleetJSON> {
	public async update(data: FleetJSON): Promise<void> {
		await super.update(data);
		for (const id of data?.ships || []) {
			const ship = this.getScene().getNodeById(id);
			if (!ship) {
				continue;
			}
			ship.parent = this;
		}
	}
}
FleetRenderer satisfies RendererStatic<FleetRenderer>;
entityRenderers.set('Fleet', FleetRenderer);
