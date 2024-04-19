import { Engine } from '@babylonjs/core/Engines/engine';
import type { IVector3Like } from '@babylonjs/core/Maths/math.like';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { getAccount, type Account } from '@blankstorm/api';
import $ from 'jquery';
import { Level } from '../core/level';
import { execCommandString } from '../core/commands';
import type { EntityJSON } from '../core/entities/entity';
import type { GenericProjectile } from '../core/generic/hardpoints';
import type { ItemID } from '../core/generic/items';
import { config, version } from '../core/metadata';
import { xpToLevel } from '../core/utils';
import * as renderer from '../renderer/index';
import { playsound } from './audio';
import * as chat from './chat';
import { isServer, setDebug, setPath } from './config';
import * as locales from './locales';
import * as mods from './mods';
import * as saves from './saves';
import * as servers from './servers';
import * as settings from './settings';
import { ScreenshotUI } from './ui/screenshot';
import * as ui from './ui/ui';
import * as user from './user';
import { alert, cookies, fixPaths, logger, minimize } from './utils';
import { waypoints } from './waypoints';
import { changeUI } from './ui/utils';

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

export let currentLevel: Level;

export function clearLevel(): void {
	currentLevel = null;
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
	_initLog('Initializing...');
	if (isInitialized) {
		logger.warn('Tried to initialize context that is already initialized.');
		return;
	}

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
				label: 'General',
				parent: $('#settings div.general'),
			},
			{
				id: 'keybinds',
				label: 'Keybinds',
				parent: $('#settings div.keybinds'),
			},
			{
				id: 'debug',
				label: 'Debug',
				parent: $('#settings div.debug'),
			},
		],
		items: [
			{
				id: 'font_size',
				section: 'general',
				type: 'number',
				kind: 'range',
				label: val => `Font Size (${val}px)`,
				min: 10,
				max: 20,
				step: 1,
				value: 13,
			},
			{
				id: 'chat_timeout',
				section: 'general',
				type: 'number',
				kind: 'range',
				label: val => `Chat Timeout (${val} seconds)`,
				min: 5,
				max: 15,
				step: 1,
				value: 10,
			},
			{
				id: 'sensitivity',
				section: 'general',
				type: 'number',
				kind: 'range',
				label: val => `Camera Sensitivity (${((val as number) * 100).toFixed()}%)`,
				min: 0.1,
				max: 2,
				step: 0.05,
				value: 1,
			},
			{
				id: 'music',
				section: 'general',
				type: 'number',
				kind: 'range',
				label: val => `Music Volume (${((val as number) * 100).toFixed()}%)`,
				min: 0,
				max: 1,
				step: 0.05,
				value: 1,
			},
			{
				id: 'sfx',
				section: 'general',
				type: 'number',
				kind: 'range',
				label: val => `Sound Effects Volume (${((val as number) * 100).toFixed()}%)`,
				min: 0,
				max: 1,
				step: 0.05,
				value: 1,
			},
			{
				id: 'locale',
				section: 'general',
				type: 'select',
				label: 'Language',
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
			<settings.ItemOptions>{
				id: 'forward',
				section: 'keybinds',
				type: 'keybind',
				label: 'Forward',
				value: { key: 'w' },
			},
			{
				id: 'left',
				section: 'keybinds',
				type: 'keybind',
				label: 'Strafe Left',
				value: { key: 'a' },
			},
			{
				id: 'right',
				section: 'keybinds',
				type: 'keybind',
				label: 'Strafe Right',
				value: { key: 'd' },
			},
			{
				id: 'back',
				section: 'keybinds',
				type: 'keybind',
				label: 'Backward',
				value: { key: 's' },
			},
			{
				id: 'chat',
				section: 'keybinds',
				type: 'keybind',
				label: 'Toggle Chat',
				value: { key: 't' },
			},
			{
				id: 'command',
				section: 'keybinds',
				type: 'keybind',
				label: 'Toggle Command',
				value: { key: '/' },
			},
			{
				id: 'toggle_temp_menu',
				section: 'keybinds',
				type: 'keybind',
				label: 'Toggle Temporary Ingame Menu',
				value: { key: 'Tab' },
			},
			{
				id: 'toggle_menu',
				section: 'keybinds',
				type: 'keybind',
				label: 'Toggle Ingame Menu',
				value: { key: 'e' },
			},
			{
				id: 'toggle_map',
				section: 'keybinds',
				type: 'keybind',
				label: 'Toggle Map',
				value: { key: 'm' },
			},
			{
				id: 'map_move_left',
				section: 'keybinds',
				type: 'keybind',
				label: 'Map Move Left',
				value: { key: 'ArrowLeft' },
			},
			{
				id: 'map_move_down',
				section: 'keybinds',
				type: 'keybind',
				label: 'Map Move Down',
				value: { key: 'ArrowDown' },
			},
			{
				id: 'map_move_right',
				section: 'keybinds',
				type: 'keybind',
				label: 'Map Move Right',
				value: { key: 'ArrowRight' },
			},
			{
				id: 'map_move_up',
				section: 'keybinds',
				type: 'keybind',
				label: 'Map Move Up',
				value: { key: 'ArrowUp' },
			},
			{
				id: 'screenshot',
				section: 'keybinds',
				type: 'keybind',
				label: 'Take Screenshot',
				value: { key: 'F2' },
			},
			{
				id: 'save',
				section: 'keybinds',
				type: 'keybind',
				label: 'Save Game',
				value: { key: 's', ctrl: true },
			},
		],
	});
	settings.items.get('forward').addEventListener('trigger', () => {
		renderer.getCamera().addVelocity(Vector3.Forward());
	});
	settings.items.get('left').addEventListener('trigger', () => {
		renderer.getCamera().addVelocity(Vector3.Left());
	});
	settings.items.get('right').addEventListener('trigger', () => {
		renderer.getCamera().addVelocity(Vector3.Right());
	});
	settings.items.get('back').addEventListener('trigger', () => {
		renderer.getCamera().addVelocity(Vector3.Backward());
	});
	settings.items.get('chat').addEventListener('trigger', e => {
		e.preventDefault();
		chat.toggleUI();
	});
	settings.items.get('command').addEventListener('trigger', e => {
		e.preventDefault();
		chat.toggleUI(true);
	});
	settings.items.get('toggle_menu').addEventListener('trigger', () => {
		// not implemented
	});
	settings.items.get('toggle_map').addEventListener('trigger', () => {
		changeUI('#map');
	});
	settings.items.get('toggle_temp_menu').addEventListener('trigger', () => {
		changeUI('#ingame-temp-menu');
	});
	settings.items.get('screenshot').addEventListener('trigger', () => {
		new ScreenshotUI(canvas[0].toDataURL('image/png'));
	});
	settings.items.get('save').addEventListener('trigger', e => {
		e.preventDefault();
		saves.flush();
	});

	_initLog('Loading locales...');
	await locales.init();

	_initLog('Loading Mods...');
	await mods.init();

	_initLog('Initializing renderer...');
	try {
		await renderer.init(canvas[0], message => {
			renderer.logger.log('Initializing renderer: ' + message);
			$('#loading_cover p').text('Initializing ' + message);
		});
	} catch (err) {
		throw new Error('Failed to initalize renderer: ' + err, { cause: err.stack });
	}

	_initLog('Authenticating...');
	if (!navigator.onLine) {
		logger.warn('Could not authenitcate (offline)');
	}
	if (!cookies.has('token')) {
		logger.warn('Could not authenitcate (no token)');
	}
	if (cookies.has('token') && navigator.onLine) {
		try {
			const result: Account = await getAccount('token', cookies.get('token'));
			Object.assign(user.account, result);
			isMultiplayerEnabled = true;
		} catch (e) {
			throw new Error('Could not authenitcate', { cause: e.stack });
		}
	}

	_initLog('Initializing UI...');
	ui.init();

	_initLog('Registering event listeners...');
	chat.registerListeners();
	ui.registerListeners();

	_initLog('Updating UI...');
	ui.update();
	_initLog('Done!');
	$('#loading_cover').fadeOut(1000);
	logger.log('Client loaded successful');
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
	} catch (e) {
		logger.error('Client initialization failed: ' + (e.cause ?? e.stack));
		await alert('Client initialization failed: ' + fixPaths(e.cause ?? e.stack));
		if (!debug) {
			close();
		}
		throw e;
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
	waypoints;
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
				V: (${camera.velocity
					.asArray()
					.map(e => e.toFixed(1))
					.join(', ')}) 
				R: (${camera.alpha.toFixed(2)}, ${camera.beta.toFixed(2)})
			</span><br>
		`);
	const { usedJSHeapSize: used = 0, jsHeapSizeLimit: limit = 0, totalJSHeapSize: total = 0 } = globalThis.performance?.memory || {},
		glInfo = renderer.engine.getGlInfo();
	$('#debug .right').html(`
			<span>Babylon v${Engine.Version} | jQuery v${$.fn.jquery}</span><br>
			<span>${glInfo.version}</span><br>
			<span>${glInfo.renderer}</span><br>
			<span>${`${(used / 1000000).toFixed()}MB/${(limit / 1000000).toFixed()}MB (${(total / 1000000).toFixed()}MB Allocated)`}</span><br>
			<span>${navigator.hardwareConcurrency || 'Unknown'} CPU Threads</span><br><br>
		`);

	renderer.render();
}

export function update() {
	try {
		_update();
	} catch (e) {
		logger.error('Client update failed: ' + (e.cause ?? e.stack));
		alert('Client update failed: ' + fixPaths(e.cause ?? e.stack));
		throw e;
	}
}

export function pause() {
	isPaused = true;
}

export function unpause() {
	isPaused = false;
}

export function load(level: Level): boolean {
	if (!level) {
		logger.warn('No level loaded');
		alert('No level loaded');
		return false;
	}
	if (level.version != version) {
		logger.warn(`Can not play level #${level.id}: `);
		alert('Incompatible version');
		return false;
	}

	$('#save-list,#server-list').hide();
	$('canvas.game').show().trigger('focus');
	$('#hud').show();
	currentLevel = level;
	renderer.clear();
	renderer.update(currentLevel.toJSON());
	level.on('projectile_fire', async (hardpointID: string, targetID: string, projectile: GenericProjectile) => {
		renderer.fireProjectile(hardpointID, targetID, projectile);
	});
	level.on('player_levelup', async () => {
		logger.debug('Triggered player_levelup (unimplemented)');
	});
	level.on('player_removed', async () => {
		renderer.getCamera().reset();
	});
	level.on('entity_path_start', async (entityID: string, path: IVector3Like[]) => {
		renderer.startFollowingPath(entityID, path);
	});
	level.on('entity_death', async (entity: EntityJSON) => {
		if (entity.entityType == 'Ship') {
			playsound('destroy_ship', +settings.get('sfx'));
		}
	});
	level.on('fleet_items_change', async (_, items: Record<ItemID, number>) => {
		for (const [id, amount] of Object.entries(items) as [ItemID, number][]) {
			$(ui.items.get(id)).find('.count').text(minimize(amount));
		}
	});
	unpause();

	return true;
}

export function unload(): void {
	for (const event of ['projectile_fire', 'update', 'player_levelup', 'player_removed', 'entity_path_start', 'entity_death', 'fleet_items_change'] as const) {
		currentLevel.off(event);
	}
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

export function send(command: RPCCommand, ...data): void {
	if (isServer) {
		servers.socket.emit(command, data);
		return;
	}

	switch (command) {
		case 'chat':
			chat.sendMessage(...data);
		case 'command':
			execCommandString(command, { executor: user.player() }, true);
	}
}
