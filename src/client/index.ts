import $ from 'jquery';
import * as client from './client';
import { logger } from './utils';

$.ajaxSetup({ timeout: 3000 });
$.event.special.wheel = {
	setup: function (_, ns, handle) {
		this.addEventListener('wheel', handle as unknown as EventListener, { passive: true });
	},
};

const options = await $app.options();
if (options.debug) {
	logger.info('Debug mode enabled');
	Object.assign(globalThis, {
		client,
		core: await import('../core'),
		renderer: await import('../renderer'),
		ui: await import('./ui'),
		map: await import('./ui/map'),
		user: await import('./user'),
		$,
	});
}
await client.init(options);
