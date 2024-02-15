import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Engine } from '@babylonjs/core/Engines/engine';
import { type Account, getAccount } from '@blankstorm/api';
import $ from 'jquery';
import { config, version } from '../core/metadata';
import { Logger } from 'logzen';
import type { SerializedSystem } from '../core/System';
import type { GenericProjectile } from '../core/generic/hardpoints';
import type { ItemCollection, ItemID } from '../core/generic/items';
import type { SerializedNode } from '../core/nodes/Node';
import { ClientLevel } from './level';
import * as saves from './saves';
import * as servers from './servers';
import * as settings from './settings';
import { alert, cookies, fixPaths, minimize } from './utils';
import * as locales from './locales';
import { playsound } from './audio';
import * as renderer from '../renderer/index';
import { context as ui, update as updateUI, init as initUI, registerListeners as registerUIListeners } from './ui/ui';
import { ScreenshotUI } from './ui/screenshot';
import { execCommandString } from '../core/commands';
import { xpToLevel } from '../core/utils';
import * as user from './user';

const fs = $app.require('fs');

export interface ChatInfo {
	/**
	 * The index for which input is being shown
	 */
	index: number;

	/**
	 * The current, uncached input
	 */
	currentInput: string;

	/**
	 * array of previous inputs
	 */
	inputs: string[];

	/**
	 * Easter egg
	 */
	eggCounter: number;
}

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

export const logger = new Logger();
logger.on('send', $app.log);

export let currentLevel: ClientLevel;

export let isPaused: boolean;

export let isInitialized: boolean = false;

export let isMultiplayerEnabled: boolean = false;

export let hitboxesEnabled: boolean = false;
export function toggleHitboxes() {
	hitboxesEnabled = !hitboxesEnabled;
}

export const screenshots = [];

const mods = new Map();

export const chatInfo: ChatInfo = { index: 0, currentInput: '', inputs: [], eggCounter: 0 };

export let path: string;

export let debug: boolean = false;

export function flushSave() {
	if (!(currentLevel instanceof ClientLevel)) {
		throw 'Save Error: you must have a valid save selected.';
	}
	$('#pause .save').text('Saving...');
	try {
		const save = saves.get(currentLevel.id);
		save.data = currentLevel.toJSON();
		saves.set(currentLevel.id, save);
		sendChatMessage('Game saved.');
	} catch (err) {
		sendChatMessage('Failed to save game.');
		throw err;
	}
	$('#pause .save').text('Save Game');
}

export function toggleChatUI(command?: boolean) {
	$('#chat,#chat-history').toggle();
	if ($('#chat-input').toggle().is(':visible')) {
		renderer.getCamera().detachControl();
		$('#chat-input').trigger('focus');
		if (command) {
			$('#chat-input').val('/');
		}
	} else {
		$('canvas.game').trigger('focus');
	}
}

export function changeUI(selector: string, hideAll?: boolean) {
	if ($(selector).is(':visible')) {
		$('canvas.game').trigger('focus');
		$(selector).hide();
	} else if ($('.game-ui').not(selector).is(':visible') && hideAll) {
		$('canvas.game').trigger('focus');
		$('.game-ui').hide();
	} else if (!$('.game-ui').is(':visible')) {
		renderer.getCamera().detachControl();
		$(selector).show().trigger('focus');
	}
}

export function runCommand(command: string): string | void {
	if (currentLevel.isServer) {
		servers.get(servers.selected).socket.emit('command', command);
	} else {
		return execCommandString(command, { executor: user.player() }, true);
	}
}

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
	if (!fs.existsSync(path + '/saves')) {
		fs.mkdirSync(path + '/saves');
	}
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
		toggleChatUI();
	});
	settings.items.get('command').addEventListener('trigger', e => {
		e.preventDefault();
		toggleChatUI(true);
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
		flushSave();
	});

	$('#map,#map-markers').on('keydown', e => {
		const speed = e.shiftKey ? 100 : 10,
			max = config.system_generation.max_size / 2;
		switch (e.key) {
			case settings.get<settings.Keybind>('map_move_left').key:
				ui.map.x = Math.max(ui.map.x - speed, -max);
				break;
			case settings.get<settings.Keybind>('map_move_right').key:
				ui.map.x = Math.min(ui.map.x + speed, max);
				break;
			case settings.get<settings.Keybind>('map_move_up').key:
				ui.map.y = Math.max(ui.map.y - speed, -max);
				break;
			case settings.get<settings.Keybind>('map_move_down').key:
				ui.map.y = Math.min(ui.map.y + speed, max);
				break;
		}
		updateUI();
	});
	$('#map,#map-markers').on('wheel', ({ originalEvent: evt }: JQuery.TriggeredEvent & { originalEvent: WheelEvent }) => {
		ui.map.scale = Math.min(Math.max(ui.map.scale - Math.sign(evt.deltaY) * 0.1, 0.5), 5);
		updateUI();
	});

	_initLog('Initializing locales...');
	locales.on('fetch', ({ language, name }: locales.Locale) => {
		settings.items.get('locale').addOption(language, name);
	});
	locales.on('load', ({ language, name }: locales.Locale) => {
		logger.debug(`Loaded locale "${name}" (${language})`);
	});
	await locales.init('locales/en.json');
	for (const [id, section] of settings.sections) {
		section.label = () => locales.text('menu.settings_section.' + id);
	}
	_initLog('Loading Mods...');
	try {
		if (!fs.existsSync('mods')) {
			fs.mkdirSync('mods');
		}

		const mods = fs.readdirSync('mods');
		logger.log('Loaded mods: ' + (mods.join('\n') || '(none)'));
	} catch (err) {
		throw new Error('Failed to load mods: ' + err, { cause: err.stack });
	}

	_initLog('Initializing renderer...');
	try {
		await renderer.init(canvas[0], msg => {
			_initLog(`Initalizing renderer: ${msg}`);
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
	initUI();

	_initLog('Registering event listeners...');
	registerUIListeners();

	_initLog('Updating UI...');
	updateUI();
	_initLog('Done!');
	$('#loading_cover').fadeOut(1000);
	logger.log('Client loaded successful');
	renderer.engine.runRenderLoop(update);
	setInterval(() => {
		if (currentLevel instanceof ClientLevel && !isPaused) {
			currentLevel.tick();
		}
	}, 1000 / config.tick_rate);
	isInitialized = true;
}

export async function init({ path: _path = '.', debug: _debug = false }: Partial<ClientInit> = {}): Promise<void> {
	if (isInitialized) {
		logger.warn('Attempted to initialize client that was already initialized. (Options ignored)');
		return;
	}
	try {
		path = _path;
		debug = _debug;
		await _init();
		return;
	} catch (e) {
		logger.error('Client initialization failed: ' + (e.cause ?? e.stack));
		await alert('Client initialization failed: ' + fixPaths(e.cause ?? e.stack));
		if (!_debug) {
			close();
		}
		throw e;
	}
}

export async function reload() {
	updateUI();
}

function _update() {
	if (!(currentLevel instanceof ClientLevel) || isPaused) {
		return;
	}
	const camera = renderer.getCamera(),
		currentSystem = currentLevel.getNodeSystem(currentLevel.activePlayer);
	camera.angularSensibilityX = camera.angularSensibilityY = 2000 / +settings.get('sensitivity');
	for (const waypoint of currentSystem.waypoints) {
		const pos = waypoint.screenPos;
		waypoint.marker
			.css({
				position: 'fixed',
				left: Math.min(Math.max(pos.x, 0), innerWidth - +settings.get('font_size')) + 'px',
				top: Math.min(Math.max(pos.y, 0), innerHeight - +settings.get('font_size')) + 'px',
				fill: waypoint.color.toHexString(),
			})
			.filter('p')
			.text(
				Vector2.Distance(new Vector2(pos.x, pos.y), new Vector2(innerWidth / 2, innerHeight / 2)) < 60 || waypoint.active
					? `${waypoint.name} - ${minimize(Vector3.Distance(user.player().position, waypoint.position))} km`
					: ''
			);
		waypoint.marker[pos.z > 1 && pos.z < 1.15 ? 'hide' : 'show']();
	}
	$('#hud p.level').text(Math.floor(xpToLevel(user.player().xp)));
	$('#hud svg.xp rect').attr('width', (xpToLevel(user.player().xp) % 1) * 100 + '%');
	$('#debug .left').html(`
			<span>${version} ${mods.size ? `[${[...mods.values()].join(', ')}]` : `(vanilla)`}</span><br>
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

export function startPlaying(level: ClientLevel): boolean {
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
	renderer.update(user.system().toJSON());
	level.isActive = true;
	level.on('projectile.fire', async (hardpointID: string, targetID: string, projectile: GenericProjectile) => {
		renderer.fireProjectile(hardpointID, targetID, projectile);
	});
	level.on('system.tick', async (system: SerializedSystem) => {
		if (user.system().id == system.id) {
			renderer.update(system);
		}
	});
	level.on('player.levelup', async () => {
		logger.debug('Triggered player.levelup (unimplemented)');
	});
	level.on('player.death', async () => {
		renderer.getCamera().reset();
	});
	level.on('entity.follow_path.start', async (entityID: string, path: number[][]) => {
		renderer.startFollowingPath(entityID, path);
	});
	level.on('entity.death', async (node: SerializedNode) => {
		if (node.nodeType == 'ship') {
			playsound('destroy_ship', +settings.get('sfx'));
		}
	});
	level.on('player.items.change', async (player, items: ItemCollection) => {
		for (const [id, amount] of Object.entries(items) as [ItemID, number][]) {
			$(ui.items.get(id)).find('.count').text(minimize(amount));
		}
	});
	unpause();

	return true;
}

export function stopPlaying(level: ClientLevel): void {
	for (const event of ['projectile.fire', 'level.tick', 'player.levelup', 'player.death', 'entity.follow_path.start', 'entity.death', 'player.items.change']) {
		level.off(event);
	}
	pause();
}

export function setInitText(text: string): void {
	$('#loading_cover p').text(text);
	logger.log('init: ' + text);
}

export function sendChatMessage(...msg: string[]): void {
	for (const m of msg) {
		logger.log('CHAT: ' + m);
		$(`<li bg=none></li>`)
			.text(m)
			.appendTo('#chat')
			.fadeOut(1000 * +settings.get('chat_timeout'));
		$(`<li bg=none></li>`).text(m).appendTo('#chat-history');
	}
}
