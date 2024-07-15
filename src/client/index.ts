import $ from 'jquery';
import { logger as coreLogger } from '../core';
import * as client from './client';
import { logger } from './utils';
import { LogLevel } from 'logzen';

addEventListener('error', ev => {
	$app.log({
		contents: ev.error.stack,
		level: LogLevel.ERROR,
		prefix: 'client',
	});
	//logger.error(ev.error);
});

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
		ui: await import('./ui/ui'),
		map: await import('./ui/map'),
		user: await import('./user'),
		$,
	});
}
coreLogger.on('send', entry => $app.log({ ...entry, prefix: 'core' }));
$('body').on('contextmenu', () => options.debug);
await client.init(options);
