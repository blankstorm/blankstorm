import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Engine } from '@babylonjs/core/Engines/engine';
import $ from 'jquery';
$.ajaxSetup({ timeout: 3000 });

import { GAME_URL, config, version, versions } from '../core/meta';
import { isHex, isJSON, random, xpToLevel } from '../core/utils';
import { commands, execCommandString } from '../core/commands';
import * as api from '../core/api';
import { Ship } from '../core/entities/Ship';
import type { Player } from '../core/entities/Player';
import type { Entity } from '../core/entities/Entity';
import type { ShipType } from '../core/generic/ships';
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
	$('#esc .save').text('Saving...');
	try {
		const save = saves.get(current.id);
		save.data = current.serialize();
		saves.set(current.id, save);
		chat('Game saved.');
	} catch (err) {
		chat('Failed to save game.');
		throw err;
	}
	$('#esc .save').text('Save Game');
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
settings.items.get('nav').addEventListener('trigger', () => {
	changeUI('#q');
});
settings.items.get('inv').addEventListener('trigger', () => {
	changeUI('#e');
});
settings.items.get('screenshot').addEventListener('trigger', () => {
	screenshots.push(canvas[0].toDataURL('image/png'));
	ui.update(player.data(), current);
});
settings.items.get('save').addEventListener('trigger', updateSave);
for (const section of settings.sections.values()) {
	$(section).attr({
		bg: 'none',
		'overflow-scroll': 'y',
		'no-box-shadow': '',
	});
}

$('#loading_cover p').text('Initializing locales...');
import { locales } from './locales';
import type { LocaleEvent } from './locales';
locales.addEventListener('fetch', (e: LocaleEvent) => {
	settings.items.get('locale').addOption(e.locale.language, e.locale.name);
});
await locales.init('locales/en.json');
for(const [id, section] of settings.sections){
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
	$('#chat,#chat_history').toggle();
	if ($('#cli').toggle().is(':visible')) {
		renderer.getCamera().detachControl();
		$('#cli').focus();
		if (command) {
			$('#cli').val('/');
		}
	} else {
		canvas.focus();
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
		canvas.focus();
		$(selector).hide();
	} else if ($('[game-ui]').not(selector).is(':visible') && hideAll) {
		canvas.focus();
		$('[game-ui]').hide();
	} else if (!$('[game-ui]').is(':visible')) {
		renderer.getCamera().detachControl();
		$(selector).show().trigger('focus');
	}
};
const cli = { line: 0, currentInput: '', i: $('#cli').val(), prev: [], counter: 0 };

export const chat = (...msg: string[]) => {
	for (const m of msg) {
		console.log(`[chat] ${m}`);
		$(`<li bg=none></li>`)
			.text(m)
			.appendTo('#chat')
			.fadeOut(1000 * +settings.get('chat_timeout'));
		$(`<li bg=none></li>`).text(m).appendTo('#chat_history');
	}
};

export const player: {
	id: string;
	username: string;
	parseAuthData(text: string): void;
	updateFleet(): void;
	chat(...msg: string[]): void;
	data(id?: string): Player & { oplvl: number };
	get isInBattle(): boolean;
	authData?: string;
} = {
	id: '[guest]',
	username: '[guest]',
	parseAuthData(text) {
		player.authData = text;
		if (isJSON(text)) {
			const data = JSON.parse(text);
			if (!data.error) {
				chat(`Authenication failed: ${data.result} `);
			} else {
				localStorage.auth = JSON.stringify(data.result);
				Object.assign(player, data.result);
			}
		} else if (text == undefined) {
			chat('Failed to connect to account servers or API is no longer compatible.');
		}
	},
	updateFleet: () => {
		if (player.data().fleet.length <= 0) {
			chat(locales.text`player.death`);
			for (const type of ['mosquito', 'cillus']) {
				const ship = new Ship(null, player.data().level, { type: type as ShipType, power: player.data().power });
				ship.parent = ship.owner = player.data();
				player.data().fleet.push(ship);
			}
		}
	},
	chat: (...msg) => {
		for (const m of msg) {
			chat(`${player.username}: ${m}`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
		}
	},
	data: (id?: string) => (_mp ? servers.get(servers.selected)?.level : current)?.entities?.get(id ?? player.id) ?? {},
	get isInBattle() {
		return this.data().fleet.some(ship => !!ship.battle);
	},
};

onresize = () => {
	renderer.engine.resize();
	console.warn('Do not paste any code someone gave you, as they may be trying to steal your information');
};

$('#loading_cover p').text('Authenticating...');
if (cookies.has('token') && navigator.onLine) {
	try {
		let res;
		try {
			res = await api.requestUserInfo('token', cookies.get('token'));
		} catch (e) {
			throw 'Fetch failed';
		}
		if (res.error) {
			throw `Couldn't log you in (${res.result})`;
		}
		player.id = res.result.id;
		player.username = res.result.username;
		player.authData = res.result;
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
ui.init(player.data(), current);

//Load saves and servers into the game
$('#loading_cover p').text('Loading saves...');
if (!fs.existsSync('saves')) {
	fs.mkdirSync('saves');
}
export const saves = new SaveMap('saves');

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
$('#esc .resume').on('click', () => {
	$('#esc').hide();
	canvas.focus();
	isPaused = false;
});
$('#esc .save').on('click', updateSave);
$('#esc .options').on('click', () => {
	ui.setLast('#esc');
	$('#esc').hide();
	$('#settings').show();
});
$('#esc .quit').on('click', () => {
	isPaused = true;
	$('[ingame]').hide();
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
			const res = await api.login(email, password);
			document.cookie = `token=${res.result.token}`;
			$('#login').find('.error').hide().text('');
			$<HTMLDialogElement>('#login')[0].close();
			await alert(`Welcome, ${res.result.username}! ` + locales.text`menu.logged_in.message`);
			location.reload();
		} catch (e) {
			$('#login').find('.error').text(e.message).show();
		}
	});
$('.nav button.inv').on('click', () => {
	$('#q>:not(.nav)').hide();
	$('div.item-bar').show();
	$('div.inv').css('display', 'grid');
});
$('.nav button.map').on('click', () => {
	$('#q>:not(.nav)').hide();
	$('.map').css('display', 'grid');
});
$('.nav button.screenshots').on('click', () => {
	$('#q>:not(.nav)').hide();
	$('div.screenshots').css('display', 'grid');
});
$('.nav button.warp').on('click', () => {
	$('#q>:not(.nav)').hide();
	$('div.warp').show();
});
$('.nav button.yrd').on('click', () => {
	$('#e>:not(.nav)').hide();
	$('div.yrd').css('display', 'grid');
});
$('.nav button.lab').on('click', () => {
	$('#e>:not(.nav)').hide();
	$('div.lab').css('display', 'grid');
});
$('.nav button.trade').on('click', () => {
	$('#e>:not(.nav)').hide();
	$('div.trade').css('display', 'grid');
});
$('button.map.new').on('click', () => {
	Waypoint.dialog(current);
});
$('#settings-nav button:not(.back)').on('click', e => {
	const target = $(e.target),
		button = target.is('button') ? target : target.parent('button');
	$('#settings>div:not(#settings-nav)')
		.hide()
		.filter(`[setting-section=${button.attr('setting-section')}]`)
		.show();
});
$('#settings button.mod').on('click', () => {
	$('#settings ul.mod')
		.show()
		.empty()
		.append(
			$('<h2 style=text-align:center>Mods</h2>'),
			$('<button plot=r15px,b15px,100px,35px,a><svg><use href=images/icons.svg#trash /></svg>&nbsp;Reset</button>').on('click', async () => {
				if (!fs.existsSync('mods')) {
					fs.mkdirSync('mods');
				}
				for (const name of fs.readdirSync('mods')) {
					fs.rmSync('mods/' + name);
				}
				alert('Requires reload');
			}),
			$(`<button plot=r130px,b15px,100px,35px,a><svg><use href=images/icons.svg#plus /></svg></i>&nbsp;${locales.text`menu.upload`}</button>`).on('click', () => {
				//upload('.js').then(files => [...files].forEach(file => file.text().then(mod => loadMod(mod))));
				alert('Mods are not supported.');
			})
		);
	ui.update(player.data(), current);
});
$('#settings button.back').on('click', () => {
	$('#settings').hide();
	$(ui.getLast()).show();
	ui.update(player.data(), current);
});
$('#q div.warp button.warp').on('click', () => {
	const destination = new Vector3(+$('input.warp.x').val(), 0, +$('input.warp.y').val());
	player.data().fleet.forEach(ship => {
		const offset = random.cords(player.data().power, true);
		ship.jump(destination.add(offset));
		chat(ship.name + ' Jumped');
	});
	$('#q').toggle();
});
/*$('[label]').each((i, e) => {
	let val = e.value;
	$(e).attr('ui-label', random.hex(32));
	$(`<label>${$(e).attr('label')} ${$(e).attr('display') && e.localName == 'input' ? eval(`\`(${$(e).attr('display')})\``) : ''} </label>`)
		.attr('for', $(e).attr('ui-label'))
		.insertBefore($(e));
});*/
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
	const wpd = $<HTMLDialogElement & { _waypoint: Waypoint }>('#waypoint-dialog')[0];
	const data = new FormData($<HTMLFormElement>('#waypoint-dialog form')[0]);
	const x = +data.get('x'),
		y = +data.get('x'),
		z = +data.get('x'),
		color = data.get('color') as string,
		name = data.get('name') as string;
	if (!isHex(data.get('color').slice(1))) {
		alert(locales.text`error.waypoint.color`);
	} else if (Math.abs(x) > 99999 || Math.abs(y) > 99999 || Math.abs(z) > 99999) {
		alert(locales.text`error.waypoint.range`);
	} else if (wpd._waypoint instanceof Waypoint) {
		Object.assign(wpd._waypoint, {
			name,
			color: Color3.FromHexString(color),
			position: new Vector3(x, y, z),
		});
	} else {
		new Waypoint(
			{
				name,
				color: Color3.FromHexString(color),
				position: new Vector3(x, y, z),
			},
			current
		);
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
$('#cli').on('keydown', e => {
	if (cli.line == 0) cli.currentInput = $('#cli').val() as string;
	switch (e.key) {
		case 'Escape':
			toggleChat();
			break;
		case 'ArrowUp':
			if (cli.line > -cli.prev.length) $('#cli').val(cli.prev.at(--cli.line));
			if (cli.line == -cli.prev.length) if (++cli.counter == 69) $('#cli').val('nice');
			break;
		case 'ArrowDown':
			cli.counter = 0;
			if (cli.line < 0) ++cli.line == 0 ? $('#cli').val(cli.currentInput) : $('#cli').val(cli.prev.at(cli.line));
			break;
		case 'Enter':
			cli.counter = 0;
			if (/[^\s/]/.test($('#cli').val() as string)) {
				if (cli.prev.at(-1) != cli.currentInput) cli.prev.push($('#cli').val());
				if ($('#cli').val()[0] == '/') chat(runCommand(($('#cli').val() as string).slice(1)) as string);
				else _mp ? servers.get(servers.selected).socket.emit('chat', $('#cli').val()) : player.chat($('#cli').val() as string);
				$('#cli').val('');
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
$('canvas.game,[ingame-ui],#hud,#tablist').on('keydown', e => {
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

$('#q').on('keydown', e => {
	if (e.key == settings.get('nav') || e.key == 'Escape') {
		changeUI('#q');
	}
});
$('#e')
	.on('keydown', e => {
		if (e.key == settings.get('inv') || e.key == 'Escape') {
			changeUI('#e');
		}
	})
	.on('click', () => ui.update(player.data(), current));
$('canvas.game,#esc,#hud').on('keydown', e => {
	if (e.key == 'Escape') {
		changeUI('#esc', true);
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
}, 1000 / Level.TickRate);

const loop = () => {
	if (current instanceof Level && !isPaused) {
		const camera = renderer.getCamera();
		camera.angularSensibilityX = camera.angularSensibilityY = 2000 / +settings.get('sensitivity');
		current.waypoints.forEach(waypoint => {
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
					Vector2.Distance(pos, new Vector2(innerWidth / 2, innerHeight / 2)) < 60 || waypoint.marker.eq(0).is(':hover') || waypoint.marker.eq(1).is(':hover')
						? `${waypoint.name} - ${minimize(Vector3.Distance(player.data().position, waypoint.position))} km`
						: ''
				);
			waypoint.marker[pos.z > 1 && pos.z < 1.15 ? 'hide' : 'show']();
		});
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
