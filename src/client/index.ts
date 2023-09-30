import $ from 'jquery';
$.ajaxSetup({ timeout: 3000 });
$.event.special.wheel = {
	setup: function (_, ns, handle) {
		this.addEventListener('wheel', handle as unknown as EventListener, { passive: true });
	},
};

import { Client } from './client';

const client = new Client('.', app);

await client.init();
