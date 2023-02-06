import * as renderer from './renderer/index.js';

export const core = new Map([
	[
		'projectile.fire',
		async evt => {
			renderer.fireProjectile(evt.emitter, evt.data.target, evt.data.projectile);
		},
	],
	['level.tick', async evt => {
		renderer.update(evt.emitter.serialize());
	}],
	['player.levelup', async evt => {}],
	['entity.death', async evt => {}],
]);
