import * as renderer from './renderer/index.js';
import { sounds, playsound } from './audio.js';
import Ship from '../core/entities/Ship.js';
import { settings } from './index.js';

export const core = new Map([
	[
		'projectile.fire',
		async evt => {
			renderer.fireProjectile(evt.emitter, evt.data.target, evt.data.projectile);
		},
	],
	[
		'level.tick',
		async evt => {
			renderer.update(evt.emitter);
		},
	],
	['player.levelup', async () => {}],
	[
		'player.death',
		async () => {
			renderer.getCamera().reset();
		},
	],
	[
		'entity.follow_path.start',
		async evt => {
			renderer.startFollowingPath(evt.emitter, evt.data.path);
		},
	],
	[
		'entity.death',
		async evt => {
			if (evt.emitter instanceof Ship) {
				playsound(sounds.get('destroy_ship'), settings.get('sfx'));
			}
		},
	],
]);
