import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { getAccount, type Account } from '@blankstorm/api';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import $ from 'jquery';
import { author } from '../../package.json';
import { execCommandString } from '../core/commands';
import { tickInfo } from '../core/entities/.tmp.entity';
import { BS_Level } from '../core/level';
import { config, currentVersion } from '../core/metadata';
import { xpToLevel } from '../core/utils';
import * as renderer from '../renderer/index';
import * as chat from './chat';
import { enableMultiplayer, isPaused, isServer, setDebug, setPath } from './config';
import { level } from './level';
import * as locales from './locales';
import * as mods from './mods';
import * as saves from './saves';
import * as servers from './servers';
import * as settings from './settings';
import * as ui from './ui';
import { switchTo } from './ui/utils';
import * as user from './user';
import { logger, optionsOf } from './utils';

export interface ClientInit {
	/**
	 * The directory to use for client data
	 */
	path: string;

	/**
	 * Whether debugging is enabled
	 */
	debug: boolean;

	/**
	 * The token to be used for authentication
	 */
	token?: string;

	/**
	 * The session to be used (unused)
	 */
	session?: string;
}

export let isInitialized: boolean = false;

function _initLog(message: string): void {
	$('#loading_cover p').text(message);
	logger.info(message);
}

export async function init({ path = '.', debug = false }: Partial<ClientInit> = {}): Promise<void> {
	if (isInitialized) {
		logger.warn('Attempted to initialize client that was already initialized. (Options ignored)');
		return;
	}
	setPath(path);
	setDebug(debug);

	if ('client_init' in sessionStorage) {
		_initLog('Reloading...');
	} else {
		_initLog('Initializing...');
		sessionStorage.client_init = true;
	}

	if (isInitialized) {
		logger.warn('Tried to initialize client after it was already initialized.');
		return;
	}

	$<HTMLParagraphElement>('p.copyright').text(`Copyright © ${new Date().getFullYear()} ${author.name}. All Rights Reserved.`);
	const canvas = $<HTMLCanvasElement>('canvas.game');

	_initLog('Loading saves...');
	saves.init();

	_initLog('Loading servers...');
	servers.init();

	_initLog('Initializing settings...');
	settings.init();

	_initLog('Loading settings...');
	settings.load({
		sections: [
			{
				id: 'general',
				icon: 'gear',
				isDefault: true,
			},
			{
				id: 'keybinds',
				icon: 'keyboard',
			},
			{
				id: 'debug',
				icon: 'bug',
			},
		],
		items: [
			{
				id: 'font_size',
				section: 'general',
				type: 'number',

				label: val => `${locales.text('setting.font_size')} (${val}px)`,
				attributes: { min: 10, max: 20, step: 1 },
				value: 13,
			},
			{
				id: 'chat_timeout',
				section: 'general',
				type: 'number',

				label: val => `${locales.text('setting.chat_timeout')} (${val} seconds)`,
				attributes: { min: 5, max: 15, step: 1 },
				value: 10,
			},
			{
				id: 'sensitivity',
				section: 'general',
				type: 'number',

				label: val => `${locales.text('setting.sensitivity')} (${((val as number) * 100).toFixed()}%)`,
				attributes: { min: 0.1, max: 2, step: 0.05 },
				value: 1,
			},
			{
				id: 'music',
				section: 'general',
				type: 'number',

				label: val => `${locales.text('setting.music')} (${((val as number) * 100).toFixed()}%)`,
				attributes: { min: 0, max: 1, step: 0.05 },
				value: 1,
			},
			{
				id: 'sfx',
				section: 'general',
				type: 'number',
				label: val => `${locales.text('setting.sfx')} (${((val as number) * 100).toFixed()}%)`,
				attributes: { min: 0, max: 1, step: 0.05 },
				value: 1,
			},
			{
				id: 'locale',
				section: 'general',
				type: 'select',
				label: () => locales.text('setting.locale'),
				value: 'en',
			},
			{
				id: 'show_path_gizmos',
				section: 'debug',
				type: 'boolean',
				label: () => locales.text('setting.show_path_gizmos'),
				value: false,
			},
			{
				id: 'tooltips',
				section: 'debug',
				type: 'boolean',
				label: () => locales.text('setting.tooltips'),
				value: false,
			},
			{
				id: 'disable_saves',
				section: 'debug',
				type: 'boolean',
				label: () => locales.text('setting.disable_saves'),
				value: false,
			},
			{
				id: 'forward',
				section: 'keybinds',
				type: 'keybind',
				label: () => locales.text('setting.forward'),
				value: { key: 'w', ctrl: false, alt: false },
			},
			{
				id: 'left',
				section: 'keybinds',
				type: 'keybind',
				label: () => locales.text('setting.left'),
				value: { key: 'a', ctrl: false, alt: false },
			},
			{
				id: 'right',
				section: 'keybinds',
				type: 'keybind',
				label: () => locales.text('setting.right'),
				value: { key: 'd', ctrl: false, alt: false },
			},
			{
				id: 'back',
				section: 'keybinds',
				type: 'keybind',
				label: () => locales.text('setting.back'),
				value: { key: 's', ctrl: false, alt: false },
			},
			{
				id: 'chat',
				section: 'keybinds',
				type: 'keybind',
				label: () => locales.text('setting.chat'),
				value: { key: 't', ctrl: false, alt: false },
			},
			{
				id: 'command',
				section: 'keybinds',
				type: 'keybind',
				label: () => locales.text('setting.command'),
				value: { key: '/', ctrl: false, alt: false },
			},
			{
				id: 'toggle_temp_menu',
				section: 'keybinds',
				type: 'keybind',
				label: () => locales.text('setting.toggle_temp_menu'),
				value: { key: 'Tab', ctrl: false, alt: false },
			},
			{
				id: 'toggle_menu',
				section: 'keybinds',
				type: 'keybind',
				label: () => locales.text('setting.toggle_menu'),
				value: { key: 'e', ctrl: false, alt: false },
			},
			{
				id: 'toggle_map',
				section: 'keybinds',
				type: 'keybind',
				label: () => locales.text('setting.toggle_map'),
				value: { key: 'm', ctrl: false, alt: false },
			},
			{
				id: 'map_move_left',
				section: 'keybinds',
				type: 'keybind',
				label: () => locales.text('setting.map_move_left'),
				value: { key: 'ArrowLeft', ctrl: false, alt: false },
			},
			{
				id: 'map_move_down',
				section: 'keybinds',
				type: 'keybind',
				label: () => locales.text('setting.map_move_down'),
				value: { key: 'ArrowDown', ctrl: false, alt: false },
			},
			{
				id: 'map_move_right',
				section: 'keybinds',
				type: 'keybind',
				label: () => locales.text('setting.map_move_right'),
				value: { key: 'ArrowRight', ctrl: false, alt: false },
			},
			{
				id: 'map_move_up',
				section: 'keybinds',
				type: 'keybind',
				label: () => locales.text('setting.map_move_up'),
				value: { key: 'ArrowUp', ctrl: false, alt: false },
			},
			{
				id: 'screenshot',
				section: 'keybinds',
				type: 'keybind',
				label: () => locales.text('setting.screenshot'),
				value: { key: 'F2', ctrl: false, alt: false },
			},
			{
				id: 'save',
				section: 'keybinds',
				type: 'keybind',
				label: () => locales.text('setting.save'),
				value: { key: 's', ctrl: true, alt: false },
			},
		],
	});
	settings.items.get('forward')!.onTrigger = () => renderer.addCameraVelocity(Vector3.Forward());
	settings.items.get('left')!.onTrigger = () => renderer.addCameraVelocity(Vector3.Left());
	settings.items.get('right')!.onTrigger = () => renderer.addCameraVelocity(Vector3.Right());
	settings.items.get('back')!.onTrigger = () => renderer.addCameraVelocity(Vector3.Backward());
	settings.items.get('chat')!.onTrigger = e => {
		e.preventDefault();
		chat.toggleUI();
	};
	settings.items.get('command')!.onTrigger = e => {
		e.preventDefault();
		chat.toggleUI(true);
	};
	settings.items.get('toggle_menu')!.onTrigger = () => null;
	settings.items.get('toggle_map')!.onTrigger = () => switchTo('#map');
	settings.items.get('toggle_temp_menu')!.onTrigger = () => switchTo('#ingame-temp-menu');
	settings.items.get('screenshot')!.onTrigger = () => {
		canvas[0].toBlob(async (blob: Blob | null) => {
			const data = await blob?.arrayBuffer();
			if (!data) {
				chat.sendMessage(locales.text('screenshot_failed'));
				return;
			}
			const name = new Date().toISOString().replaceAll(':', '.') + '.png';
			if (!existsSync(path + '/screenshots/')) {
				mkdirSync(path + '/screenshots/');
			}
			writeFileSync(path + '/screenshots/' + name, new Uint8Array(data));
			chat.sendMessage('Saved screenshot to ' + name);
		});
	};
	settings.items.get('save')!.onTrigger = e => {
		e.preventDefault();
		saves.flush();
	};

	_initLog('Loading locales...');
	await locales.init();

	_initLog('Loading Mods...');
	mods.init();

	_initLog('Initializing renderer...');
	try {
		await renderer.init(canvas[0]);
	} catch (error) {
		throw new Error('Failed to initialize renderer: ' + error, optionsOf(error));
	}

	_initLog('Authenticating...');
	if (!navigator.onLine) {
		logger.warn('Could not authenticate (offline)');
	}

	const token = (await $app.options()).token;
	if (!token) {
		logger.warn('Could not authenticate (no token)');
	}
	if (token && navigator.onLine) {
		try {
			const result: Account = await getAccount('token', token);
			Object.assign(user.account, result);
			enableMultiplayer();
		} catch (error) {
			throw new Error('Could not authenticate', optionsOf(error));
		}
	}

	_initLog('Initializing UI...');
	await ui.init();

	_initLog('Registering event listeners...');
	chat.registerListeners();
	ui.registerListeners();

	_initLog('Updating UI...');
	ui.update();
	$('#loading_cover p').text('Done!');
	$('#loading_cover').fadeOut(1000);
	logger.info('Loaded successfully');
	renderer.engine.runRenderLoop(update);
	setInterval(() => {
		if (!isPaused && !isServer && level instanceof BS_Level) {
			level.tick();
		}
	}, 1000 / config.tick_rate);
	isInitialized = true;
}

export function reload() {
	ui.update();
}

export function update() {
	if (!(level instanceof BS_Level) || isPaused) {
		return;
	}
	const camera = renderer.getCamera();
	camera.angularSensibilityX = camera.angularSensibilityY = 2000 / +settings.get('sensitivity');
	$('#hud p.level').text(Math.floor(xpToLevel(user.player().xp)));
	$('#hud svg.xp rect').attr('width', (xpToLevel(user.player().xp) % 1) * 100 + '%');
	$('#debug .left').html(`
			<span>${currentVersion} ${mods.size ? `[${[...mods.ids()].join(', ')}]` : `(vanilla)`}</span><br>
			<span>${renderer.engine.getFps().toFixed()} FPS | ${level.tps.toFixed()} TPS</span><br>
			<span>${level.id} (${level.date.toLocaleString()})</span><br><br>
			<span>
				P: (${camera.target
					.asArray()
					.map(e => e.toFixed(1))
					.join(', ')}) 
				V: (${renderer.cameraVelocity
					.asArray()
					.map(e => e.toFixed(1))
					.join(', ')}) 
				R: (${camera.alpha.toFixed(2)}, ${camera.beta.toFixed(2)})
			</span><br>
		`);
	const { usedJSHeapSize: used = 0, jsHeapSizeLimit: limit = 0, totalJSHeapSize: total = 0 } = globalThis.performance?.memory || {},
		glInfo = renderer.engine.getGlInfo();
	$('#debug .right').html(`
			<span>${glInfo.version}</span><br>
			<span>${glInfo.renderer}</span><br>
			<span>${`${(used / 1000000).toFixed()}MB/${(limit / 1000000).toFixed()}MB (${(total / 1000000).toFixed()}MB Allocated)`}</span><br>
			<span>${navigator.hardwareConcurrency || 'Unknown'} CPU Threads</span><br><br>

			<span>Updates: ${tickInfo.updates} | +${tickInfo.additions}/-${tickInfo.deletions}</span>
		`);

	void renderer.render();
}

function send(command: 'chat' | 'command', ...data: string[]): void {
	if (isServer) {
		servers.socket.emit(command, data);
		return;
	}

	switch (command) {
		case 'chat':
			chat.sendMessage(...data);
			break;
		case 'command':
			execCommandString(command, { executor: user.player() }, true);
	}
}

chat.onSend(send);
