import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Engine } from '@babylonjs/core/Engines/engine';
import $ from 'jquery';
$.ajaxSetup({ timeout: 3000 });

import { GAME_URL, config, version, versions } from '../core/meta';
import { isHex, isJSON, xpToLevel } from '../core/utils';
import { commands, execCommandString } from '../core/commands';
import * as api from '../core/api';
import type { Player } from '../core/entities/Player';
import type { Entity } from '../core/entities/Entity';
import { Level } from '../core/Level';
import type { Keybind } from './settings';
import { upload, minimize, alert, cookies } from './utils';
import { Waypoint } from './waypoint';
import { SaveMap, Save, LiveSave } from './Save';
import { ServerMap, Server } from './Server';
import fs from './fs';
import * as ui from './ui/ui';
import { sounds, playsound } from './audio';
import * as renderer from '../renderer/index';

//Set the title
document.title = 'Blankstorm ' + versions.get(version).text;
$('#main .version a').text(versions.get(version).text).attr('href', `${GAME_URL}/versions#${version}`);

$('#loading_cover p').text('Loading...');
export let current: LiveSave;
export function setCurrent(val) {
	current = val;
}
const updateSave = () => {
	if (!(current instanceof LiveSave)) {
		throw 'Save Error: you must have a valid save selected.';
	}
	$('#pause .save').text('Saving...');
	try {
		const save = saves.get(current.id);
		save.data = current.serialize();
		saves.set(current.id, save);
		chat('Game saved.');
	} catch (err) {
		chat('Failed to save game.');
		throw err;
	}
	$('#pause .save').text('Save Game');
};

$('#loading_cover p').text('Initializing settings...');
import { settings } from './settings';
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
	screenshots.push(canvas[0].toDataURL('image/png'));
	ui.update(player.data(), current);
});
settings.items.get('save').addEventListener('trigger', e => {
	e.preventDefault();
	updateSave();
});

$('#loading_cover p').text('Initializing locales...');
import { locales } from './locales';
import type { LocaleEvent } from './locales';
locales.addEventListener('fetch', (e: LocaleEvent) => {
	settings.items.get('locale').addOption(e.locale.language, e.locale.name);
});
await locales.init('locales/en.json');
for (const [id, section] of settings.sections) {
	section.label = () => locales.text('menu.settings_section.' + id);
}

//load mods (if any)
$('#loading_cover p').text('Loading Mods...');
try {
	if (!fs.existsSync('mods')) {
		fs.mkdirSync('mods');
	}

	const mods = fs.readdirSync('mods');
	console.log('Loaded mods: ' + (mods.join('\n') || '(none)'));
} catch (err) {
	console.error('Failed to load mods: ' + err);
}

export let isPaused = true,
	_mp = false,
	mpEnabled = false,
	hitboxes = false;

export const canvas = $<HTMLCanvasElement>('canvas.game'),
	setPaused = paused => (isPaused = paused);

$('#loading_cover p').text('Initalizing ');
try {
	await renderer.init(canvas[0], msg => {
		$('#loading_cover p').text(`Initalizing renderer: ${msg}`);
	});
} catch (err) {
	console.error('Failed to initalize renderer: ' + err.stack);
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
	if (_mp) {
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

export const chat = (...msg: string[]) => {
	for (const m of msg) {
		console.log(`[chat] ${m}`);
		$(`<li bg=none></li>`)
			.text(m)
			.appendTo('#chat')
			.fadeOut(1000 * +settings.get('chat_timeout'));
		$(`<li bg=none></li>`).text(m).appendTo('#chat-history');
	}
};

export const player: {
	id: string;
	username: string;
	chat(...msg: string[]): void;
	data(id?: string): Player & { oplvl: number };
	authData?: api.ApiReducedUserResult;
} = {
	id: '[guest]',
	username: '[guest]',
	chat: (...msg) => {
		for (const m of msg) {
			chat(`${player.username}: ${m}`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
		}
	},
	data: (id?: string) => (_mp ? servers.get(servers.selected)?.level : current)?.entities?.get(id ?? player.id) ?? {},
};

onresize = () => {
	renderer.engine.resize();
	console.warn('Do not paste any code someone gave you, as they may be trying to steal your information');
};

$('#loading_cover p').text('Authenticating...');
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
oncontextmenu = () => {
	$('.cm').not(':last').remove();
};
onclick = () => {
	$('.cm').remove();
};

$('#loading_cover p').text('Loading Locales...');
ui.init({
	get level() {
		return current;
	},
	get playerID() {
		return player.data().id;
	},
});

//Load saves and servers into the game
$('#loading_cover p').text('Loading saves...');
if (!fs.existsSync('saves')) {
	fs.mkdirSync('saves');
}
export const saves = new SaveMap('saves');
saves.activePlayer = player.id;

$('#loading_cover p').text('Loading servers...');
export const servers = new ServerMap('servers.json');

commands.set('playsound', {
	exec(context, name, volume = settings.get('sfx')) {
		if (sounds.has(name)) {
			playsound(sounds.get(name), volume);
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
export const eventLog = [];
if (config.debug_mode) {
	$('#loading_cover p').text('Debug: Assigning variables...');
	const BABYLON = await import('@babylonjs/core/index'),
		core = await import('../core/index'),
		{ default: io } = await import('socket.io-client'),
		UI = await import('./ui/index');

	Object.assign(window, {
		core,
		cookies,
		eventLog,
		settings,
		locales,
		$,
		io,
		api,
		renderer,
		player,
		saves,
		servers,
		fs,
		config,
		ui,
		UI,
		_mp,
		changeUI,
		BABYLON,
		Save,
		LiveSave,
		Server,
		getCurrent() {
			return current;
		},
	});
}

$('#loading_cover p').text('Registering event listeners...');
//Event Listeners (UI transitions, creating saves, etc.)

$('#main .sp').on('click', () => {
	_mp = false;
	$('#main').hide();
	$('#save-list').show();
});
$('#main .mp').on('click', () => {
	if (mpEnabled) {
		_mp = true;
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
	ui.update(player.data(), current);
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
	const server = servers.has(id) ? servers.get(id) : new Server(url, name, servers);
	if (servers.has(id)) {
		server.name = name;
		server._url = url;
	}
	ui.update(player.data(), current);
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
	ui.update(player.data(), current);
	$<HTMLDialogElement>('#save-edit')[0].close();
});
$('#save-edit .cancel').on('click', () => {
	$<HTMLDialogElement>('#save-edit')[0].close();
});
$('#save-list button.upload').on('click', async () => {
	const files = await upload('.json');
	const text = await files[0].text();
	if (isJSON(text)) {
		new Save(JSON.parse(text), saves);
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
	new Save(live.serialize(), saves);
	live.play(saves);
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
	if (_mp) {
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
	ui.update(player.data(), current);
});
$('#settings div.general input').on('change', () => ui.update(player.data(), current));
$<HTMLInputElement>('#settings div.general select[name=locale]').on('change', e => {
	const lang = e.target.value;
	if (locales.has(lang)) {
		locales.load(lang);
	} else {
		alert('That locale is not loaded.');
		console.warn(`Failed to load locale ${lang}`);
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
		const waypoint = wpd[0]._waypoint instanceof Waypoint ? wpd[0]._waypoint : new Waypoint(null, false, false, current);
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
				else _mp ? servers.get(servers.selected).socket.emit('chat', $('#chat-input').val()) : player.chat($('#chat-input').val() as string);
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

	if (current instanceof LiveSave) {
		renderer.handleCanvasClick(e, renderer.scene.getNodeById(player.id));
	}
	ui.update(player.data(), current);
});
canvas.on('contextmenu', e => {
	if (current instanceof LiveSave) {
		const data = renderer.handleCanvasRightClick(e, renderer.scene.getNodeById(player.id));
		for (const { entityRenderer, point } of data) {
			const entity = current.getNodeByID(entityRenderer.id) as Entity;
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
			if (_mp) $('#tablist').show();
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
			if (_mp) $('#tablist').hide();
			break;
	}
});

$('#ingame-temp-menu')
	.on('keydown', e => {
		if (e.key == settings.get('toggle_temp_menu') || e.key == 'Escape') {
			changeUI('#ingame-temp-menu');
		}
	})
	.on('click', () => ui.update(player.data(), current));
$('canvas.game,#pause,#hud').on('keydown', e => {
	if (e.key == 'Escape') {
		changeUI('#pause', true);
		isPaused = !isPaused;
	}
	ui.update(player.data(), current);
});
$('button').on('click', () => {
	playsound(sounds.get('ui'), +settings.get('sfx'));
});
setInterval(() => {
	if (current instanceof LiveSave && !isPaused) {
		current.tick();
	}
}, 1000 / config.tick_rate);

const loop = () => {
	if (current instanceof Level && !isPaused) {
		const camera = renderer.getCamera();
		camera.angularSensibilityX = camera.angularSensibilityY = 2000 / +settings.get('sensitivity');
		for (const waypoint of current.waypoints) {
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

ui.update(player.data(), current);
$('#loading_cover p').text('Done!');
$('#loading_cover').fadeOut(1000);
console.log('Game loaded successful');
renderer.engine.runRenderLoop(loop);
