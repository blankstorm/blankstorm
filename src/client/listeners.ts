import * as renderer from '../renderer/index';
import { sounds, playsound } from './audio';
import { settings } from './settings';
import type { LevelEvent, ListenerCollection } from '../core/events';
import { minimize } from './utils';
import { item_ui } from './ui/ui';
import type { ItemID } from '../core/generic/items';
import type { SerializedLevel } from '../core/Level';

export const core: ListenerCollection<LevelEvent> = {
	'projectile.fire': async evt => {
		renderer.fireProjectile(evt.emitter.id, evt.data.target, evt.data.projectile);
	},
	'level.tick': async evt => {
		renderer.update(evt.emitter as SerializedLevel);
	},
	'player.levelup': async () => {
		console.debug('Triggered player.levelup (unimplemented)');
	},
	'player.death': async () => {
		renderer.getCamera().reset();
	},
	'entity.follow_path.start': async evt => {
		renderer.startFollowingPath(evt.emitter.id, evt.data.path);
	},
	'entity.death': async evt => {
		if ('node_type' in evt.emitter && evt.emitter.node_type == 'ship') {
			playsound(sounds.get('destroy_ship'), +settings.get('sfx'));
		}
	},
	'player.items.change': async evt => {
		for (const [id, amount] of Object.entries(evt.data) as [ItemID, number][]) {
			$(item_ui[id]).find('.count').text(minimize(amount));
		}
	},
};
