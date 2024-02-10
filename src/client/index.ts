import $ from 'jquery';
import { Client } from './client';

$.ajaxSetup({ timeout: 3000 });
$.event.special.wheel = {
	setup: function (_, ns, handle) {
		this.addEventListener('wheel', handle as unknown as EventListener, { passive: true });
	},
};

const client = new Client();
const options = await $app.options();
await client.init(options);
