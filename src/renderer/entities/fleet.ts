import type { FleetJSON } from '~/core/components/fleet';
import { EntityRenderer, renderers, type Renderer } from './entity';

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
renderers.set('Fleet', FleetRenderer);
