import $ from 'jquery';
import { LogLevel } from 'logzen';
import { logger as coreLogger } from '../core';
import * as client from './client';
import { alert, confirm } from './ui/dialog';
import { logger } from './utils';

addEventListener('error', async ({ error }: { error: Error }) => {
	$app.log({
		contents: error.stack!,
		level: LogLevel.ERROR,
		prefix: 'client',
	});

	let notice: string =
		'\n\n\nThe game will now exit to avoid further issues.' +
		(options.debug ? ' Press cancel to continue in an unstable state.\nDoing so could lead to data loss, please take caution.' : '');

	try {
		const { text } = await import('./locales');

		notice = '\n\n\n' + text('uncaught_error') + (options.debug ? ' ' + text('uncaught_error_debug') : '');
	} catch (_) {}

	if (options.debug ? !(await confirm(error.stack + notice)) : await alert(error.toString() + notice).then(() => false)) {
		return;
	}

	close();
});

$.event.special.wheel = {
	setup: function (_, ns, handle) {
		this.addEventListener('wheel', handle as unknown as EventListener, { passive: true });
	},
};

declare global {
	// eslint-disable-next-line no-var
	var options: client.ClientInit;
}

const options = (globalThis.options = await $app.options());
if (options.debug) {
	logger.info('Debug mode enabled');
	Object.assign(globalThis, {
		client,
		core: await import('../core'),
		renderer: await import('../renderer'),
		ui: await import('./ui'),
		user: await import('./user'),
		locales: await import('./locales'),
		settings: await import('./settings'),
		utils: await import('./utils'),
		saves: await import('./saves'),
		servers: await import('./servers'),
		$,
	});
}
coreLogger.on('send', entry => $app.log({ ...entry, prefix: 'core' }));
$('body').on('contextmenu', () => options.debug);
await client.init(options);
