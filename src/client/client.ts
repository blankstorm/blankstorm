import type { IVector3Like } from '@babylonjs/core/Maths/math.like';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { getAccount, type Account } from '@blankstorm/api';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import $ from 'jquery';
import { author } from '../../package.json';
import { execCommandString } from '../core/commands';
import { tickInfo, type EntityJSON } from '../core/entities/entity';
import type { ItemID } from '../core/generic/items';
import { Level } from '../core/level';
import { config, game_url, version, versions } from '../core/metadata';
import { xpToLevel } from '../core/utils';
import * as renderer from '../renderer/index';
import { playsound } from './audio';
import * as chat from './chat';
import { isServer, path, setDebug, setPath } from './config';
import * as locales from './locales';
import * as mods from './mods';
import * as saves from './saves';
import * as servers from './servers';
import * as settings from './settings';
import * as ui from './ui';
import { alert } from './ui/dialog';
import * as user from './user';
import { cookies, logger, minimize, optionsOf } from './utils';

export interface ClientInit {
	/**
	 * The directory to use for client data
	 */
	path: string;

	/**
	 * Whether debugging is enabled
	 */
	debug: boolean;
}

export let currentLevel: Level | null;

export function getCurrentLevel(): Level {
	if (!currentLevel) {
		throw new ReferenceError('No current level');
	}
	return currentLevel;
}

export function clearLevel(): void {
	logger.debug('Clearing current level');
	currentLevel = null;
	$('.waypoint-li,.waypoint-marker').remove();
}

export let isPaused: boolean;

export let isInitialized: boolean = false;

export let isMultiplayerEnabled: boolean = false;

export let hitboxesEnabled: boolean = false;
export function toggleHitboxes() {
	hitboxesEnabled = !hitboxesEnabled;
}

export const screenshots = [];

function _initLog(message: string): void {
	$('#loading_cover p').text(message);
	logger.log(message);
}

async function _init(): Promise<void> {
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

	if (config.load_remote_manifest) {
		fetch(game_url + '/versions.json')
			.then(response => response.json())
			.then(data => {
				for (const [key, value] of data) {
					versions.set(key, value);
				}
			})
			.catch(err => logger.warn('Failed to retrieve version manifest: ' + err));
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

				label: val => `Font Size (${val}px)`,
				attributes: { min: 10, max: 20, step: 1 },
				value: 13,
			},
			{
				id: 'chat_timeout',
				section: 'general',
				type: 'number',

				label: val => `Chat Timeout (${val} seconds)`,
				attributes: { min: 5, max: 15, step: 1 },
				value: 10,
			},
			{
				id: 'sensitivity',
				section: 'general',
				type: 'number',

				label: val => `Camera Sensitivity (${((val as number) * 100).toFixed()}%)`,
				attributes: { min: 0.1, max: 2, step: 0.05 },
				value: 1,
			},
			{
				id: 'music',
				section: 'general',
				type: 'number',

				label: val => `Music Volume (${((val as number) * 100).toFixed()}%)`,
				attributes: { min: 0, max: 1, step: 0.05 },
				value: 1,
			},
			{
				id: 'sfx',
				section: 'general',
				type: 'number',
				label: val => `Sound Effects Volume (${((val as number) * 100).toFixed()}%)`,
				attributes: { min: 0, max: 1, step: 0.05 },
				value: 1,
			},
			{
				id: 'locale',
				section: 'general',
				type: 'select',
				label: 'Language',
				value: 'en',
			},
			{
				id: 'show_path_gizmos',
				section: 'debug',
				type: 'boolean',
				label: 'Show Path Gizmos',
				value: false,
			},
			{
				id: 'tooltips',
				section: 'debug',
				type: 'boolean',
				label: 'Show Advanced Tooltips',
				value: false,
			},
			{
				id: 'disable_saves',
				section: 'debug',
				type: 'boolean',
				label: 'Disable Saves',
				value: false,
			},
			{
				id: 'forward',
				section: 'keybinds',
				type: 'keybind',
				label: 'Forward',
				value: { key: 'w', ctrl: false, alt: false },
			},
			{
				id: 'left',
				section: 'keybinds',
				type: 'keybind',
				label: 'Strafe Left',
				value: { key: 'a', ctrl: false, alt: false },
			},
			{
				id: 'right',
				section: 'keybinds',
				type: 'keybind',
				label: 'Strafe Right',
				value: { key: 'd', ctrl: false, alt: false },
			},
			{
				id: 'back',
				section: 'keybinds',
				type: 'keybind',
				label: 'Backward',
				value: { key: 's', ctrl: false, alt: false },
			},
			{
				id: 'chat',
				section: 'keybinds',
				type: 'keybind',
				label: 'Toggle Chat',
				value: { key: 't', ctrl: false, alt: false },
			},
			{
				id: 'command',
				section: 'keybinds',
				type: 'keybind',
				label: 'Toggle Command',
				value: { key: '/', ctrl: false, alt: false },
			},
			{
				id: 'toggle_temp_menu',
				section: 'keybinds',
				type: 'keybind',
				label: 'Toggle Temporary Ingame Menu',
				value: { key: 'Tab', ctrl: false, alt: false },
			},
			{
				id: 'toggle_menu',
				section: 'keybinds',
				type: 'keybind',
				label: 'Toggle Ingame Menu',
				value: { key: 'e', ctrl: false, alt: false },
			},
			{
				id: 'toggle_map',
				section: 'keybinds',
				type: 'keybind',
				label: 'Toggle Map',
				value: { key: 'm', ctrl: false, alt: false },
			},
			{
				id: 'map_move_left',
				section: 'keybinds',
				type: 'keybind',
				label: 'Map Move Left',
				value: { key: 'ArrowLeft', ctrl: false, alt: false },
			},
			{
				id: 'map_move_down',
				section: 'keybinds',
				type: 'keybind',
				label: 'Map Move Down',
				value: { key: 'ArrowDown', ctrl: false, alt: false },
			},
			{
				id: 'map_move_right',
				section: 'keybinds',
				type: 'keybind',
				label: 'Map Move Right',
				value: { key: 'ArrowRight', ctrl: false, alt: false },
			},
			{
				id: 'map_move_up',
				section: 'keybinds',
				type: 'keybind',
				label: 'Map Move Up',
				value: { key: 'ArrowUp', ctrl: false, alt: false },
			},
			{
				id: 'screenshot',
				section: 'keybinds',
				type: 'keybind',
				label: 'Take Screenshot',
				value: { key: 'F2', ctrl: false, alt: false },
			},
			{
				id: 'save',
				section: 'keybinds',
				type: 'keybind',
				label: 'Save Game',
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
	settings.items.get('toggle_map')!.onTrigger = () => ui.switchTo('#map');
	settings.items.get('toggle_temp_menu')!.onTrigger = () => ui.switchTo('#ingame-temp-menu');
	settings.items.get('screenshot')!.onTrigger = () => {
		canvas[0].toBlob(async blob => {
			const data = await blob?.arrayBuffer();
			if (!data) {
				chat.sendMessage('Failed to save screenshot.');
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
		throw new Error('Failed to initalize renderer: ' + error, optionsOf(error));
	}

	_initLog('Authenticating...');
	if (!navigator.onLine) {
		logger.warn('Could not authenticate (offline)');
	}
	if (!cookies.has('token')) {
		logger.warn('Could not authenticate (no token)');
	}
	if (cookies.has('token') && navigator.onLine) {
		try {
			const result: Account = await getAccount('token', cookies.get('token'));
			Object.assign(user.account, result);
			isMultiplayerEnabled = true;
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
	logger.log('Loaded successfully');
	renderer.engine.runRenderLoop(update);
	setInterval(() => {
		if (!isPaused && !isServer && currentLevel instanceof Level) {
			currentLevel.update();
		}
	}, 1000 / config.tick_rate);
	isInitialized = true;
}

export async function init({ path = '.', debug = false }: Partial<ClientInit> = {}): Promise<void> {
	if (isInitialized) {
		logger.warn('Attempted to initialize client that was already initialized. (Options ignored)');
		return;
	}
	try {
		setPath(path);
		setDebug(debug);
		await _init();
		return;
	} catch (error) {
		logger.error('Client initialization failed: ' + (error instanceof Error ? (error.cause ?? error.stack) : error));
		await alert('Client initialization failed.');
		if (!debug) {
			close();
		}
		throw error;
	}
}

export async function reload() {
	ui.update();
}

function _update() {
	if (!(currentLevel instanceof Level) || isPaused) {
		return;
	}
	const camera = renderer.getCamera();
	camera.angularSensibilityX = camera.angularSensibilityY = 2000 / +settings.get('sensitivity');
	$('#hud p.level').text(Math.floor(xpToLevel(user.player().xp)));
	$('#hud svg.xp rect').attr('width', (xpToLevel(user.player().xp) % 1) * 100 + '%');
	$('#debug .left').html(`
			<span>${version} ${mods.size ? `[${[...mods.ids()].join(', ')}]` : `(vanilla)`}</span><br>
			<span>${renderer.engine.getFps().toFixed()} FPS | ${currentLevel.tps.toFixed()} TPS</span><br>
			<span>${currentLevel.id} (${currentLevel.date.toLocaleString()})</span><br><br>
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

export function update() {
	try {
		_update();
	} catch (error) {
		logger.error('Client update failed: ' + (error instanceof Error ? (error.cause ?? error.stack) : error));
		void alert('Client update failed.');
		throw error;
	}
}

export function pause() {
	logger.debug('Paused');
	isPaused = true;
}

export function unpause() {
	logger.debug('Unpaused');
	isPaused = false;
}

export function load(level: Level): boolean {
	if (!level) {
		logger.warn('No level loaded');
		void alert('No level loaded');
		return false;
	}
	if (level.version != version) {
		logger.warn(`Can't play level ${level.id}, version mismatch`);
		void alert('Incompatible version');
		return false;
	}

	$('#saves,#server-list').hide();
	$('canvas.game').show().trigger('focus');
	$('#hud').show();
	currentLevel = level;
	renderer.clear();
	void renderer.update(currentLevel.toJSON());
	level.on('update', () => {
		void renderer.update(currentLevel!.toJSON());
	});
	level.on('player_levelup', () => {
		logger.warn('Triggered player_levelup (unimplemented)');
	});
	level.on('entity_removed', entity => {
		if (entity.entityType == 'player') {
			renderer.resetCamera();
		}
	});
	level.on('entity_path_start', (entityID: string, path: IVector3Like[]) => {
		console.debug('Moving along path:', path);
		renderer.startFollowingPath(entityID, path, settings.get('show_path_gizmos'));
	});
	level.on('entity_death', (entity: EntityJSON) => {
		if (entity.entityType == 'Ship') {
			playsound('destroy_ship', +settings.get('sfx'));
		}
	});
	level.on('fleet_items_change', (_, items: Record<ItemID, number>) => {
		for (const [id, amount] of Object.entries(items) as [ItemID, number][]) {
			$(ui.UIs.get(id)!).find('.count').text(minimize(amount));
		}
	});
	unpause();

	return true;
}

export function unload(): void {
	currentLevel?.removeAllListeners();
	pause();
	$('.ingame').hide();
	if (isServer) {
		servers.disconnect();
	} else {
		$('#main').show();
	}
	clearLevel();
}

export type RPCCommand = 'chat' | 'command';

export function send(command: RPCCommand, ...data: string[]): void {
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
