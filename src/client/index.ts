import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Engine } from '@babylonjs/core/Engines/engine';
import $ from 'jquery';
$.ajaxSetup({ timeout: 3000 });
$.event.special.wheel = {
	setup: function (_, ns, handle) {
		this.addEventListener('wheel', handle as unknown as EventListener, { passive: true });
	},
};

import { GAME_URL, config, version, versions } from '../core/metadata';
import { isHex, isJSON, xpToLevel } from '../core/utils';
import { commands, execCommandString } from '../core/commands';
import * as api from '../core/api';
import type { Player } from '../core/nodes/Player';
import type { Entity } from '../core/nodes/Entity';
import type { Keybind } from './settings';
import { upload, minimize, alert, cookies } from './utils';
import { Waypoint } from './waypoint';
import { SaveMap, Save, LiveSave } from './Save';
import { ServerMap, Server } from './Server';
import fs from './fs';
import * as ui from './ui/ui';
import { sounds, playsound } from './audio';
import * as renderer from '../renderer/index';
import { Log } from '../core/Log';
import { ClientLevel } from './ClientLevel';
import type { GenericProjectile } from '../core/generic/hardpoints';
import type { SerializedSystem } from '../core/System';
import type { SerializedNode } from '../core/nodes/Node';
import type { ItemCollection, ItemID } from '../core/generic/items';
import { settings } from './settings';

import { locales } from './locales';
import type { Locale } from './locales';
import { ScreenshotUI } from './ui/screenshot';
import { ClientContext } from './contexts';

//Set the title
document.title = 'Blankstorm ' + versions.get(version).text;
$('#main .version a').text(versions.get(version).text).attr('href', `${GAME_URL}/versions#${version}`);

export const log = new Log();

function initLog(message: string): void {
	$('#loading_cover p').text(message);
	log.log('init: ' + message);
}

export const chat = (...msg: string[]) => {
	for (const m of msg) {
		log.log(`(chat) ${m}`);
		$(`<li bg=none></li>`)
			.text(m)
			.appendTo('#chat')
			.fadeOut(1000 * +settings.get('chat_timeout'));
		$(`<li bg=none></li>`).text(m).appendTo('#chat-history');
	}
};

initLog('Initializing...');
let current: ClientLevel;
export const context: ClientContext = {
	get playerSystem() {
		return current?.getNodeSystem(current.activePlayer);
	},

	get playerID() {
		return player.data().id;
	},

	get current() {
		return current;
	},

	set current(value) {
		if (current) {
			current.isActive = false;
		}
		current = value;
		current.isActive = true;
	},

	get saves() {
		return this._saves;
	},
	get servers() {
		return this._servers;
	},
	chat,

	startPlaying(level: ClientLevel) {
		if (level.version != version) {
			alert('Incompatible version');
			return false;
		}

		$('#save-list,#server-list').hide();
		$('canvas.game').show().trigger('focus');
		$('#hud').show();
		context.current = level;
		renderer.clear();
		renderer.update(this.playerSystem.toJSON());
		level.on('projectile.fire', async (hardpointID: string, targetID: string, projectile: GenericProjectile) => {
			renderer.fireProjectile(hardpointID, targetID, projectile);
		});
		level.on('system.tick', async (system: SerializedSystem) => {
			if (this.playerSystem.id == system.id) {
				renderer.update(system);
			}
		});
		level.on('player.levelup', async () => {
			log.debug('Triggered player.levelup (unimplemented)');
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
				$(ui.item_ui[id]).find('.count').text(minimize(amount));
			}
		});
		isPaused = false;

		return true;
	},

	stopPlaying(level) {
		for (const event of ['projectile.fire', 'level.tick', 'player.levelup', 'player.death', 'entity.follow_path.start', 'entity.death', 'player.items.change']) {
			level.off(event);
		}
		isPaused = true;
		return true;
	},
};

initLog('Loading saves...');
if (!fs.existsSync('saves')) {
	fs.mkdirSync('saves');
}
const saves = new SaveMap('saves', context);

initLog('Loading servers...');
const servers = new ServerMap('servers.json', context);

const updateSave = () => {
	if (!(current instanceof ClientLevel)) {
		throw 'Save Error: you must have a valid save selected.';
	}
	$('#pause .save').text('Saving...');
	try {
		const save = saves.get(current.id);
		save.data = current.toJSON();
		saves.set(current.id, save);
		chat('Game saved.');
	} catch (err) {
		chat('Failed to save game.');
		throw err;
	}
	$('#pause .save').text('Save Game');
};

initLog('Initializing settings...');

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
	toggleChat();
});
settings.items.get('command').addEventListener('trigger', e => {
	e.preventDefault();
	toggleChat(true);
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
	updateSave();
});

$('#map,#map-markers').on('keydown', e => {
	const speed = e.shiftKey ? 100 : 10,
		max = config.system_generation.max_size / 2;
	switch (e.key) {
		case settings.get<Keybind>('map_move_left').key:
			ui.markerContext.x = Math.max(ui.markerContext.x - speed, -max);
			break;
		case settings.get<Keybind>('map_move_right').key:
			ui.markerContext.x = Math.min(ui.markerContext.x + speed, max);
			break;
		case settings.get<Keybind>('map_move_up').key:
			ui.markerContext.y = Math.max(ui.markerContext.y - speed, -max);
			break;
		case settings.get<Keybind>('map_move_down').key:
			ui.markerContext.y = Math.min(ui.markerContext.y + speed, max);
			break;
	}
	ui.update(context);
});
$('#map,#map-markers').on('wheel', ({ originalEvent: evt }: JQuery.TriggeredEvent & { originalEvent: WheelEvent }) => {
	ui.markerContext.scale = Math.min(Math.max(ui.markerContext.scale - Math.sign(evt.deltaY) * 0.1, 0.5), 5);
	ui.update(context);
});

initLog('Initializing locales...');
locales.on('fetch', (locale: Locale) => {
	settings.items.get('locale').addOption(locale.language, locale.name);
});
await locales.init('locales/en.json');
for (const [id, section] of settings.sections) {
	section.label = () => locales.text('menu.settings_section.' + id);
}

//load mods (if any)
initLog('Loading Mods...');
try {
	if (!fs.existsSync('mods')) {
		fs.mkdirSync('mods');
	}

	const mods = fs.readdirSync('mods');
	log.log('Loaded mods: ' + (mods.join('\n') || '(none)'));
} catch (err) {
	log.error('Failed to load mods: ' + err);
}

export let isPaused = true,
	mpEnabled = false,
	hitboxes = false;

export const canvas = $<HTMLCanvasElement>('canvas.game'),
	setPaused = (paused: boolean) => (isPaused = paused);

initLog('Initalizing renderer...');
try {
	await renderer.init(canvas[0], msg => {
		initLog(`Initalizing renderer: ${msg}`);
	});
} catch (err) {
	log.error('Failed to initalize renderer: ' + err.stack);
	alert('Failed to initalize renderer: ' + err.stack);
}

export const screenshots = [],
	mods = new Map();

let strobeInterval = null;
const strobe = rate => {
	if (strobeInterval) {
		clearInterval(strobeInterval);
		$(':root').css('--hue', 200);
		strobeInterval = null;
	} else {
		strobeInterval = setInterval(() => {
			let hue = +$(':root').css('--hue');
			if (hue > 360) hue -= 360;
			$(':root').css('--hue', ++hue);
		}, 1000 / rate);
	}
};
const toggleChat = (command?: boolean) => {
	$('#chat,#chat-history').toggle();
	if ($('#chat-input').toggle().is(':visible')) {
		renderer.getCamera().detachControl();
		$('#chat-input').trigger('focus');
		if (command) {
			$('#chat-input').val('/');
		}
	} else {
		canvas.trigger('focus');
	}
};
const runCommand = (command: string): string | void => {
	if (context.current.isServer) {
		servers.get(servers.selected).socket.emit('command', command);
	} else {
		return execCommandString(command, { executor: player.data() }, true);
	}
};
const changeUI = (selector: string, hideAll?: boolean) => {
	if ($(selector).is(':visible')) {
		canvas.trigger('focus');
		$(selector).hide();
	} else if ($('.game-ui').not(selector).is(':visible') && hideAll) {
		canvas.trigger('focus');
		$('.game-ui').hide();
	} else if (!$('.game-ui').is(':visible')) {
		renderer.getCamera().detachControl();
		$(selector).show().trigger('focus');
	}
};
const cli = { line: 0, currentInput: '', i: $('#chat-input').val(), prev: [], counter: 0 };

export const player: {
	id: string;
	username: string;
	chat(...msg: string[]): void;
	data(id?: string): Player;
	authData?: api.ApiReducedUserResult;
} = {
	id: '[guest]',
	username: '[guest]',
	chat: (...msg) => {
		for (const m of msg) {
			chat(`${player.username}: ${m}`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
		}
	},
	data: (id: string = player.id) => ((context.current.isServer ? servers.get(servers.selected).level : current)?.getNodeSystem(id)?.nodes?.get(id) ?? {}) as unknown as Player,
};

onresize = () => {
	renderer.engine.resize();
	console.warn('Do not paste any code someone gave you, as they may be trying to steal your information');
};

initLog('Authenticating...');
if (cookies.has('token') && navigator.onLine) {
	try {
		let result: api.ApiReducedUserResult;
		try {
			result = await api.requestUserInfo('token', cookies.get('token'));
		} catch (e) {
			throw `Couldn't log you in (${e})`;
		}
		player.id = result.id;
		player.username = result.username;
		player.authData = result;
		mpEnabled = true;
	} catch (e) {
		chat(e);
	}
}
saves.activePlayer = player.id;
oncontextmenu = () => {
	$('.context-menu').not(':last').remove();
};
onclick = () => {
	$('.context-menu').remove();
};

initLog('Loading locales...');
ui.init(context);

commands.set('playsound', {
	exec(context, name, volume = settings.get('sfx')) {
		if (sounds.has(name)) {
			playsound(name, volume);
		} else {
			throw new ReferenceError(`sound "${name}" does not exist`);
		}
	},
	oplvl: 0,
});

commands.set('reload', {
	exec() {
		//maybe also reload mods in the future
		renderer.engine.resize();
	},
	oplvl: 0,
});
if (config.debug_mode) {
	initLog('Debug: Assigning variables...');
	const BABYLON = await import('@babylonjs/core/index'),
		core = await import('../core/index'),
		{ default: io } = await import('socket.io-client'),
		utils = await import('./utils');

	Object.assign(window, {
		//libraries
		$,
		BABYLON,
		fs,
		io,

		//classes
		LiveSave,
		Server,
		Save,

		//everything else
		changeUI,
		client: context,
		buildOptions: $build,
		config,
		cookies,
		core,
		locales,
		log,
		player,
		renderer,
		settings,
		ui,
		utils,
	});
}

initLog('Registering event listeners...');
//Event Listeners (UI transitions, creating saves, etc.)

$('#main .sp').on('click', () => {
	$('#main').hide();
	$('#save-list').show();
});
$('#main .mp').on('click', () => {
	if (mpEnabled) {
		$('#main').hide();
		$('#server-list').show();
		for (const server of servers.values()) {
			server.ping();
		}
	} else {
		$<HTMLDialogElement>('#login')[0].showModal();
	}
});
$('#main .options').on('click', () => {
	ui.setLast('#main');
	$('#settings').show();
	ui.update(context);
});
$('#main .exit').on('click', () => {
	close();
});
$('.playable-list .back').on('click', () => {
	$('.playable-list').hide();
	$('#main').show();
});
$('#save-list .new').on('click', () => {
	$<HTMLDialogElement>('#save-new')[0].showModal();
});
$('#server-list .new').on('click', () => {
	$('#server-dialog').find('.name').val('');
	$('#server-dialog').find('.url').val('');
	$<HTMLDialogElement>('#server-dialog')[0].showModal();
});
$('#server-dialog .save').on('click', () => {
	const name = $('#server-dialog .name').val() as string,
		url = $('#server-dialog .url').val() as string,
		id = Server.GetID(url);
	const server = servers.has(id) ? servers.get(id) : new Server(url, name, context);
	if (servers.has(id)) {
		server.name = name;
		server._url = url;
	}
	ui.update(context);
	$<HTMLDialogElement>('#server-dialog')[0].close();
});
$('#server-dialog .cancel').on('click', () => {
	$<HTMLDialogElement>('#server-dialog')[0].close();
});
$('#save-edit .save').on('click', () => {
	const id = $('#save-edit .id').val() as string,
		name = $('#save-edit .name').val() as string;
	const save = saves.get(id);
	if (saves.has(id)) {
		save.data.name = name;
	}
	ui.update(context);
	$<HTMLDialogElement>('#save-edit')[0].close();
});
$('#save-edit .cancel').on('click', () => {
	$<HTMLDialogElement>('#save-edit')[0].close();
});
$('#save-list button.upload').on('click', async () => {
	const files = await upload('.json');
	const text = await files[0].text();
	if (isJSON(text)) {
		new Save(JSON.parse(text), context);
	} else {
		alert(`Can't load save: not JSON.`);
	}
});
$('#server-list button.refresh').on('click', () => {
	servers.forEach(server => server.ping());
});
$('#connect button.back').on('click', () => {
	$('#server-list').show();
	$('#connect').hide();
});
$('#save-new button.back').on('click', () => {
	$<HTMLDialogElement>('#save-new')[0].close();
});
$('#save-new .new').on('click', async () => {
	$<HTMLDialogElement>('#save-new')[0].close();
	const name = $('#save-new .name').val() as string;
	const live = await LiveSave.CreateDefault(name, player.id, player.username);
	new Save(live.toJSON(), context);
	context.startPlaying(live);
});
$('#pause .resume').on('click', () => {
	$('#pause').hide();
	canvas.trigger('focus');
	isPaused = false;
});
$('#pause .save').on('click', updateSave);
$('#pause .options').on('click', () => {
	ui.setLast('#pause');
	$('#pause').hide();
	$('#settings').show();
});
$('#pause .quit').on('click', () => {
	isPaused = true;
	$('.ingame').hide();
	if (context.current.isServer) {
		servers.get(servers.selected).disconnect();
	} else {
		saves.selected = null;
		$('#main').show();
	}
});
$('#login')
	.find('.cancel')
	.on('click', e => {
		e.preventDefault();
		$('#login').find('.error').hide();
		$<HTMLDialogElement>('#login')[0].close();
	});
$('#login')
	.find('button.login')
	.on('click', async e => {
		e.preventDefault();
		try {
			const email = $('#login').find('input.email').val() as string;
			const password = $('#login').find('input.password').val() as string;
			const result = await api.login(email, password);
			document.cookie = `token=${result.token}`;
			$('#login').find('.error').hide().text('');
			$<HTMLDialogElement>('#login')[0].close();
			await alert(`Welcome, ${result.username}! ` + locales.text`menu.logged_in.message`);
			location.reload();
		} catch (e) {
			$('#login').find('.error').text(e.message).show();
		}
	});
$('#ingame-temp-menu div.nav button').on('click', e => {
	const section = $(e.target).closest('button[section]').attr('section');
	$(`#ingame-temp-menu > div:not(.nav)`).hide();
	if (section == 'inventory') {
		$('div.item-bar').show();
	}
	$('#ingame-temp-menu > div.' + section).css('display', 'grid');
});
$('#map button.waypoints').on('click', () => {
	$('#waypoint-list').show();
});
$('#waypoint-list button.back').on('click', () => {
	$('#waypoint-list').hide();
});
$('#waypoint-list button.new').on('click', () => {
	const dialog = $<HTMLDialogElement>('#waypoint-dialog');
	dialog.find('input').val('');
	dialog[0].showModal();
});
$('#settings-nav button:not(.back)').on('click', e => {
	const target = $(e.target),
		button = target.is('button') ? target : target.parent('button');
	$('#settings > div:not(#settings-nav)')
		.hide()
		.filter(`[setting-section=${button.attr('setting-section')}]`)
		.show();
});

$('#settings button.back').on('click', () => {
	$('#settings').hide();
	$(ui.getLast()).show();
	ui.update(context);
});
$('#settings div.general input').on('change', () => ui.update(context));
$<HTMLInputElement>('#settings div.general select[name=locale]').on('change', e => {
	const lang = e.target.value;
	if (locales.has(lang)) {
		locales.load(lang);
	} else {
		alert('That locale is not loaded.');
		log.warn(`Failed to load locale ${lang}`);
	}
});
$('#waypoint-dialog .save').on('click', () => {
	const wpd = $<HTMLDialogElement & { _waypoint?: Waypoint }>('#waypoint-dialog');
	const x = +wpd.find('[name=x]').val(),
		y = +wpd.find('[name=y]').val(),
		z = +wpd.find('[name=z]').val(),
		color = wpd.find('[name=color]').val() as string,
		name = wpd.find('[name=name]').val() as string;
	if (!isHex(color.slice(1))) {
		alert(locales.text`error.waypoint.color`);
	} else if (Math.abs(x) > 99999 || Math.abs(y) > 99999 || Math.abs(z) > 99999) {
		alert(locales.text`error.waypoint.range`);
	} else {
		const waypoint = wpd[0]._waypoint instanceof Waypoint ? wpd[0]._waypoint : new Waypoint(null, false, false, current.getNodeSystem(current.activePlayer));
		waypoint.name = name;
		waypoint.color = Color3.FromHexString(color);
		waypoint.position = new Vector3(x, y, z);
		$<HTMLDialogElement>('#waypoint-dialog')[0].close();
	}
});
$('#waypoint-dialog .cancel').on('click', () => {
	$<HTMLDialogElement>('#waypoint-dialog')[0].close();
});
$('html')
	.on('keydown', e => {
		switch (e.key) {
			case 'F8':
				e.preventDefault();
				open(`${GAME_URL}/bugs/new`, 'target=_blank');
				break;
			case 'b':
				if (e.ctrlKey) strobe(100);
				break;
		}
	})
	.on('mousemove', e => {
		$('tool-tip').each((i, tooltip) => {
			const computedStyle = getComputedStyle(tooltip);
			const left = (settings.get('font_size') as number) + e.clientX,
				top = (settings.get('font_size') as number) + e.clientY;
			$(tooltip).css({
				left: left - (left + parseFloat(computedStyle.width) < innerWidth ? 0 : parseFloat(computedStyle.width)),
				top: top - (top + parseFloat(computedStyle.height) < innerHeight ? 0 : parseFloat(computedStyle.height)),
			});
		});
	});
$('#chat-input').on('keydown', e => {
	if (cli.line == 0) cli.currentInput = $('#chat-input').val() as string;
	switch (e.key) {
		case 'Escape':
			toggleChat();
			break;
		case 'ArrowUp':
			if (cli.line > -cli.prev.length) $('#chat-input').val(cli.prev.at(--cli.line));
			if (cli.line == -cli.prev.length) if (++cli.counter == 69) $('#chat-input').val('nice');
			break;
		case 'ArrowDown':
			cli.counter = 0;
			if (cli.line < 0) ++cli.line == 0 ? $('#chat-input').val(cli.currentInput) : $('#chat-input').val(cli.prev.at(cli.line));
			break;
		case 'Enter':
			cli.counter = 0;
			if (/[^\s/]/.test($('#chat-input').val() as string)) {
				if (cli.prev.at(-1) != cli.currentInput) cli.prev.push($('#chat-input').val());
				if ($('#chat-input').val()[0] == '/') chat(runCommand(($('#chat-input').val() as string).slice(1)) as string);
				else context.current.isServer ? servers.get(servers.selected).socket.emit('chat', $('#chat-input').val()) : player.chat($('#chat-input').val() as string);
				$('#chat-input').val('');
				toggleChat();
				cli.line = 0;
			}
			break;
	}
});
canvas.on('focus', () => {
	renderer.getCamera().attachControl(canvas, true);
});
canvas.on('click', e => {
	if (!isPaused) {
		renderer.getCamera().attachControl(canvas, true);
	}

	if (current instanceof ClientLevel) {
		renderer.handleCanvasClick(e, renderer.scene.getNodeById(player.id));
	}
	ui.update(context);
});
canvas.on('contextmenu', e => {
	if (current instanceof ClientLevel) {
		const data = renderer.handleCanvasRightClick(e, renderer.scene.getNodeById(player.id));
		for (const { entityRenderer, point } of data) {
			const entity = current.getNodeSystem(current.activePlayer).getNodeByID(entityRenderer.id) as Entity;
			entity.moveTo(point, false);
		}
	}
});
canvas.on('keydown', e => {
	switch (e.key) {
		case 'F3':
			$('#debug').toggle();
		case 'F1':
			e.preventDefault();
			$('#hud,.marker').toggle();
			break;
		case 'F4':
			e.preventDefault();
			hitboxes = !hitboxes;
			renderer.setHitboxes(hitboxes);
			break;
		case 'Tab':
			e.preventDefault();
			if (context.current.isServer) $('#tablist').show();
			break;
	}
});
$('canvas.game,.game-ui,#hud,#tablist').on('keydown', e => {
	for (const setting of [...settings.items.values()].filter(item => item.type == 'keybind')) {
		const bind = setting.value as Keybind;
		if (e.key == bind.key && (!bind.alt || e.altKey) && (!bind.ctrl || e.ctrlKey)) setting.emit('trigger');
	}
});
canvas.on('keyup', e => {
	switch (e.key) {
		case 'Tab':
			e.preventDefault();
			if (context.current.isServer) $('#tablist').hide();
			break;
	}
});

$('#ingame-temp-menu')
	.on('keydown', e => {
		if (e.key == settings.get('toggle_temp_menu') || e.key == 'Escape') {
			changeUI('#ingame-temp-menu');
		}
	})
	.on('click', () => ui.update(context));
$('canvas.game,#pause,#hud').on('keydown', e => {
	if (e.key == 'Escape') {
		changeUI('#pause', true);
		isPaused = !isPaused;
	}
	ui.update(context);
});
$('button').on('click', () => {
	playsound('ui', +settings.get('sfx'));
});
setInterval(() => {
	if (current instanceof ClientLevel && !isPaused) {
		current.tick();
	}
}, 1000 / config.tick_rate);

const loop = () => {
	if (current instanceof ClientLevel && !isPaused) {
		const camera = renderer.getCamera(),
			currentSystem = current.getNodeSystem(current.activePlayer);
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
					Vector2.Distance(new Vector2(pos.x, pos.y), new Vector2(innerWidth / 2, innerHeight / 2)) < 60 ||
						waypoint.marker.eq(0).is(':hover') ||
						waypoint.marker.eq(1).is(':hover')
						? `${waypoint.name} - ${minimize(Vector3.Distance(player.data().position, waypoint.position))} km`
						: ''
				);
			waypoint.marker[pos.z > 1 && pos.z < 1.15 ? 'hide' : 'show']();
		}
		$('#hud p.level').text(Math.floor(xpToLevel(player.data().xp)));
		$('#hud svg.xp rect').attr('width', (xpToLevel(player.data().xp) % 1) * 100 + '%');
		$('#debug .left').html(`
			<span>${version} ${mods.size ? `[${[...mods.values()].join(', ')}]` : `(vanilla)`}</span><br>
			<span>${renderer.engine.getFps().toFixed()} FPS | ${current.tps.toFixed()} TPS</span><br>
			<span>${current.id} (${current.date.toLocaleString()})</span><br><br>
			<span>
				P: (${camera.target
					.asArray()
					.map(e => e.toFixed(1))
					.join(', ')}) 
				V: (${camera.velocity
					.asArray()
					.map(e => e.toFixed(1))
					.join(', ')}}) 
				R: (${camera.alpha.toFixed(2)}, ${camera.beta.toFixed(2)})
			</span><br>
		`);
		interface _Performance extends Performance {
			memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number; totalJSHeapSize: number };
		}
		const { usedJSHeapSize: used = 0, jsHeapSizeLimit: limit = 0, totalJSHeapSize: total = 0 } = (globalThis.performance as _Performance)?.memory || {},
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
};

ui.update(context);
initLog('Done!');
$('#loading_cover').fadeOut(1000);
log.log('Client loaded successful');
renderer.engine.runRenderLoop(loop);
