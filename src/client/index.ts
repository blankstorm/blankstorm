import $ from 'jquery';
import * as client from './client';

$.ajaxSetup({ timeout: 3000 });
$.event.special.wheel = {
	setup: function (_, ns, handle) {
		this.addEventListener('wheel', handle as unknown as EventListener, { passive: true });
	},
};

const options = await $app.options();
if (options.debug) {
	client.logger.info('Debug mode enabled');
	globalThis.client = client;
}
await client.init(options);
