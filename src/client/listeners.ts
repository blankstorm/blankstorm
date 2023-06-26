import * as renderer from '../renderer/index';
import { sounds, playsound } from './audio';
import { settings } from './settings';
import { minimize } from './utils';
import { item_ui } from './ui/ui';
import type { ItemCollection, ItemID } from '../core/generic/items';
import type { SerializedSystem } from '../core/System';
import { log } from '.';
import type { GenericProjectile } from '../core/generic/hardpoints';
import type { SerializedNode } from '../core/nodes/Node';

export const core: Record<string, (...args) => Promise<unknown>> = {
	'projectile.fire': async (hardpointID: string, targetID: string, projectile: GenericProjectile) => {
		renderer.fireProjectile(hardpointID, targetID, projectile);
	},
	'level.tick': async (system: SerializedSystem) => {
		renderer.update(system);
	},
	'player.levelup': async () => {
		log.debug('Triggered player.levelup (unimplemented)');
	},
	'player.death': async () => {
		renderer.getCamera().reset();
	},
	'entity.follow_path.start': async (entityID: string, path: number[][]) => {
		renderer.startFollowingPath(entityID, path);
	},
	'entity.death': async (node: SerializedNode) => {
		if (node.nodeType == 'ship') {
			playsound(sounds.get('destroy_ship'), +settings.get('sfx'));
		}
	},
	'player.items.change': async (player, items: ItemCollection) => {
		for (const [id, amount] of Object.entries(items) as [ItemID, number][]) {
			$(item_ui[id]).find('.count').text(minimize(amount));
		}
	},
};
