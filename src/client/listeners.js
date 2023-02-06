import * as renderer from './renderer/index.js';

export const core = new Map([
	[
		'projectile.fire',
		evt => {
			renderer.fireProjectile(evt.emitter, evt.data.target, evt.data.projectile);
		},
	],
	['level.tick', evt => {
		renderer.update(evt.emitter.serialize());
	}],
	['player.levelup', evt => {}],
	['entity.death', evt => {}],
]);
