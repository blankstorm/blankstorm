import $ from 'jquery';
import * as client from './client';
import * as renderer from '../renderer';
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
		renderer,
	});
}
await client.init(options);
