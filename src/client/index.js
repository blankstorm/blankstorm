import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import $ from 'jquery';
$.ajaxSetup({ timeout: 3000 });
$.fn.cm = function (...content) {
	content ||= [$('<p></p>')];
	let menu = $('<div bg=light class=cm></div>');
	for (let c of content) {
		menu.append(c, $('<br>'));
	}
	menu.css({ position: 'fixed', width: 'fit-content', height: 'fit-content', 'max-width': '15%', padding: '1em', 'z-index': 9 });
	this.on('contextmenu', e => {
		e.preventDefault();
		menu.css({ left: e.pageX, top: e.pageY });
		this.parent().append(menu);
		const height = parseFloat(getComputedStyle(menu[0]).height);
		menu.css('top', e.pageY + height < innerHeight ? e.pageY : e.pageY - height);
	});
	return this;
};

import { version, versions, isJSON, config, Command, commands, execCommandString, random, Ship, Level, isHex } from '../core/index.js';

import { SettingsStore } from './settings.js';
import LocaleStore from './locales.js';
import { web, upload, minimize, alert } from './utils.js';
import Waypoint from './waypoint.js';
import { SaveMap, Save, LiveSave } from './Save.js';
import { ServerMap, Server } from './Server.js';
import * as renderer from './renderer/index.js';
import fs from './fs.js';
import * as ui from './ui.js';
import { sounds, playsound } from './audio.js';
import * as api from '../core/api.js';
import { Color3 } from '@babylonjs/core/index.js';

//Set the title
document.title = 'Blankstorm ' + versions.get(version).text;
$('#main .version a')
	.text(versions.get(version).text)
	.attr('href', web('versions#' + version));

$('#loading_cover p').text('Loading...');
export let current;
export function setCurrent(val) {
	current = val;
}
export const settings = new SettingsStore({
	sections: [
		{
			id: 'general',
			label: () => locales.text('menu.settings_section.general'),
			parent: $('#settings div.general'),
		},
		{
			id: 'keybinds',
			label: () => locales.text('menu.settings_section.keybinds'),
			parent: $('#settings div.keybinds'),
		},
		{
			id: 'debug',
			label: () => locales.text('menu.settings_section.debug'),
			parent: $('#settings div.debug'),
		},
	],
	items: [
		{
			id: 'font_size',
			section: 'general',
			type: 'range',
			label: val => `Font Size (${val}px)`,
			min: 10,
			max: 20,
			step: 1,
			value: 13,
		},
		{
			id: 'chat_timeout',
			section: 'general',
			type: 'range',
			label: val => `Chat Timeout (${val} seconds)`,
			min: 5,
			max: 15,
			step: 1,
			value: 10,
		},
		{
			id: 'sensitivity',
			section: 'general',
			type: 'range',
			label: val => `Camera Sensitivity (${(val * 100).toFixed()}%)`,
			min: 0.1,
			max: 2,
			step: 0.05,
			value: 1,
		},
		{
			id: 'music',
			section: 'general',
			type: 'range',
			label: val => `Music Volume (${(val * 100).toFixed()}%)`,
			min: 0,
			max: 1,
			step: 0.05,
			value: 1,
		},
		{
			id: 'sfx',
			section: 'general',
			type: 'range',
			label: val => `Sound Effects Volume (${(val * 100).toFixed()}%)`,
			min: 0,
			max: 1,
			step: 0.05,
			value: 1,
		},
		{
			id: 'render_quality',
			section: 'general',
			type: 'range',
			label: val => `Render Quality (${['Low', 'Medium', 'High'][val]})`,
			min: 0,
			max: 2,
			step: 1,
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
			label: 'Show Path Gizmos',
			value: false,
		},
		{
			id: 'tooltips',
			section: 'debug',
			label: 'Show Advanced Tooltips',
			value: false,
		},
		{
			id: 'disable_saves',
			section: 'debug',
			label: 'Disable Saves',
			value: false,
		},
		{
			id: 'forward',
			section: 'keybinds',
			type: 'keybind',
			label: 'Forward',
			value: { key: 'w' },
			onTrigger: () => {
				renderer.getCamera().addVelocity(Vector3.Forward(), true);
			},
		},
		{
			id: 'left',
			section: 'keybinds',
			type: 'keybind',
			label: 'Strafe Left',
			value: { key: 'a' },
			onTrigger: () => {
				renderer.getCamera().addVelocity(Vector3.Left(), true);
			},
		},
		{
			id: 'right',
			section: 'keybinds',
			type: 'keybind',
			label: 'Strafe Right',
			value: { key: 'd' },
			onTrigger: () => {
				renderer.getCamera().addVelocity(Vector3.Right(), true);
			},
		},
		{
			id: 'back',
			section: 'keybinds',
			type: 'keybind',
			label: 'Backward',
			value: { key: 's' },
			onTrigger: () => {
				renderer.getCamera().addVelocity(Vector3.Backward(), true);
			},
		},
		{
			id: 'chat',
			section: 'keybinds',
			type: 'keybind',
			label: 'Toggle Chat',
			value: { key: 't' },
			onTrigger: e => {
				e.preventDefault();
				toggleChat();
			},
		},
		{
			id: 'command',
			section: 'keybinds',
			type: 'keybind',
			label: 'Toggle Command',
			value: { key: '/' },
			onTrigger: e => {
				e.preventDefault();
				toggleChat(true);
			},
		},
		{
			id: 'nav',
			section: 'keybinds',
			type: 'keybind',
			label: 'Toggle Inventory',
			value: { key: 'Tab' },
			onTrigger: () => {
				changeUI('#q');
			},
		},
		{
			id: 'inv',
			section: 'keybinds',
			type: 'keybind',
			label: 'Toggle Shipyard/Lab',
			value: { key: 'e' },
			onTrigger: () => {
				changeUI('#e');
			},
		},
		{
			id: 'screenshot',
			section: 'keybinds',
			type: 'keybind',
			label: 'Take Screenshot',
			value: { key: 'F2' },
			onTrigger: () => {
				screenshots.push(canvas[0].toDataURL('image/png'));
				ui.update();
			},
		},
		{
			id: 'save',
			section: 'keybinds',
			type: 'keybind',
			label: 'Save Game',
			value: { key: 's', ctrl: true },
			onTrigger: updateSave,
		},
	],
});

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

for (let section of settings.sections.values()) {
	$(section).attr({
		bg: 'none',
		'overflow-scroll': 'y',
		'no-box-shadow': '',
	});
}

export const cookie = {};
document.cookie.split('; ').forEach(e => {
	cookie[e.split('=')[0]] = e.split('=')[1];
});

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

export const canvas = $('canvas.game'),
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
			let hue = $(':root').css('--hue');
			if (hue > 360) hue -= 360;
			$(':root').css('--hue', ++hue);
		}, 1000 / rate);
	}
};
const toggleChat = command => {
	$('#chat,#chat_history').toggle();
	if ($('#cli').toggle().is(':visible')) {
		renderer.getCamera().detachControl(canvas, true);
		$('#cli').focus();
		if (command) {
			$('#cli').val('/');
		}
	} else {
		canvas.focus();
	}
};
const runCommand = command => {
	if (_mp) {
		servers.get(servers.selected).socket.emit('command', command);
	} else {
		return execCommandString(command, player.data(), true);
	}
};
const changeUI = (selector, hideAll) => {
	if ($(selector).is(':visible')) {
		canvas.focus();
		$(selector).hide();
	} else if ($('[game-ui]').not(selector).is(':visible') && hideAll) {
		canvas.focus();
		$('[game-ui]').hide();
	} else if (!$('[game-ui]').is(':visible')) {
		renderer.getCamera().detachControl(canvas, true);
		$(selector).show().focus();
	}
};
const cli = { line: 0, currentInput: '', i: $('#cli').val(), prev: [] };

export const chat = (...msg) => {
	for (let m of msg) {
		console.log(`[chat] ${m}`);
		$(`<li bg=none></li>`)
			.text(m)
			.appendTo('#chat')
			.fadeOut(1000 * settings.get('chat_timeout'));
		$(`<li bg=none></li>`).text(m).appendTo('#chat_history');
	}
};

export const player = {
	id: '[guest]',
	username: '[guest]',
	parseAuthData(text) {
		player.authData = text;
		if (isJSON(text)) {
			let data = JSON.parse(text);
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
			for (let type of ['mosquito', 'cillus']) {
				const ship = new Ship(null, player.data().level, { type, power: player.data().power });
				ship.parent = ship.owner = player.data();
				player.data().fleet.push(ship);
			}
		}
	},
	chat: (...msg) => {
		for (let m of msg) {
			chat(`${player.username}: ${m}`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
		}
	},
	data: id => (_mp ? servers.get(servers.selected)?.level : current)?.entities?.get(id ?? player.id) ?? {},
	levelOf: xp => Math.sqrt(xp / 10),
	xpOf: level => 10 * level ** 2,
	get isInBattle() {
		return this.data().fleet.some(ship => !!ship.battle);
	},
};

onresize = () => {
	renderer.engine.resize();
	console.warn('Do not paste any code someone gave you, as they may be trying to steal your information');
};

$('#loading_cover p').text('Authenticating...');
if (cookie.token && navigator.onLine) {
	try {
		let res;
		try {
			res = await api.requestUserInfo('token', cookie.token);
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
export const locales = new LocaleStore();
await locales.fetch('locales/en.json');
locales.load('en');
ui.init();

//Load saves and servers into the game
$('#loading_cover p').text('Loading saves...');
if (!fs.existsSync('saves')) {
	fs.mkdirSync('saves');
}
export const saves = new SaveMap('saves');

$('#loading_cover p').text('Loading servers...');
export const servers = new ServerMap('servers.json');

commands.set(
	'playsound',
	new Command((name, volume = settings.get('sfx')) => {
		if (sounds.has(name)) {
			playsound(sounds.get(name), volume);
		} else {
			throw new ReferenceError(`sound "${name}" does not exist`);
		}
	}, 0)
);

commands.set(
	'reload',
	new Command(() => {
		//maybe also reload mods in the future
		renderer.engine.resize();
	}, 0)
);

export const eventLog = [];
if (config.debug_mode) {
	$('#loading_cover p').text('Debug: Assigning variables...');
	const BABYLON = await import('@babylonjs/core/index.js'),
		core = await import('../core/index.js'),
		{ default: io } = await import('socket.io-client'),
		UI = await import('./ui/index.js');

	Object.assign(window, {
		core,
		cookie,
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
		for (let server of servers.values()) {
			server.ping();
		}
	} else {
		$('#login')[0].showModal();
	}
});
$('#main .options').on('click', () => {
	ui.setLast('#main');
	$('#settings').show();
	ui.update();
});
$('.playable-list .back').on('click', () => {
	$('.playable-list').hide();
	$('#main').show();
});
$('#save-list .new').on('click', () => {
	$('#save-new')[0].showModal();
});
$('#server-list .new').on('click', () => {
	$('#server-dialog').find('.name').val('');
	$('#server-dialog').find('.url').val('');
	$('#server-dialog')[0].showModal();
});
$('#server-dialog .save').on('click', () => {
	const name = $('#server-dialog .name').val(),
		url = $('#server-dialog .url').val(),
		id = Server.GetID(url);
	const server = servers.has(id) ? servers.get(id) : new Server(url, name, servers);
	if (servers.has(id)) {
		server.name = name;
		server.url = url;
	}
	ui.update();
	$('#server-dialog')[0].close();
});
$('#server-dialog .cancel').on('click', () => {
	$('#server-dialog')[0].close();
});
$('#save-edit .save').on('click', () => {
	const id = $('#save-edit .id').val(),
		name = $('#save-edit .name').val();
	const save = saves.get(id);
	if (saves.has(id)) {
		save.name = name;
	}
	ui.update();
	$('#save-edit')[0].close();
});
$('#save-edit .cancel').on('click', () => {
	$('#save-edit')[0].close();
});
$('#save-list button.upload').on('click', async () => {
	const files = await upload('.json');
	const text = await files[0].text();
	if (isJSON(text)) {
		new Save(JSON.parse(text));
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
	$('#save-new')[0].close();
});
$('#save-new .new').on('click', async () => {
	$('#save-new')[0].close();
	const name = $('#save-new .name').val();
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
		$('#login')[0].close();
	});
$('#login')
	.find('button.login')
	.on('click', async e => {
		e.preventDefault();
		try {
			const email = $('#login').find('input.email').val();
			const password = $('#login').find('input.password').val();
			const res = await api.login(email, password);
			document.cookie = `token=${res.result.token}`;
			$('#login').find('.error').hide().text('');
			$('#login')[0].close();
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
				for (let name of fs.readdirSync('mods')) {
					fs.rmSync('mods/' + name);
				}
				alert('Requires reload');
			}),
			$(`<button plot=r130px,b15px,100px,35px,a><svg><use href=images/icons.svg#plus /></svg></i>&nbsp;${locales.text`menu.upload`}</button>`).on('click', () => {
				//upload('.js').then(files => [...files].forEach(file => file.text().then(mod => loadMod(mod))));
				alert('Mods are not supported.');
			})
		);
	ui.update();
});
$('#settings button.back').on('click', () => {
	$('#settings').hide();
	$(ui.getLast()).show();
	ui.update();
});
$('#q div.warp button.warp').on('click', () => {
	let destination = new Vector3(+$('input.warp.x').val(), 0, +$('input.warp.y').val());
	player.data().fleet.forEach(ship => {
		let offset = random.cords(player.data().power, true);
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
$('#settings div.general input').change(() => ui.update());
$('#settings div.general select[name=locale]').change(e => {
	let lang = e.target.value;
	if (locales.has(lang)) {
		locales.load(lang);
	} else {
		alert('That locale is not loaded.');
		console.warn(`Failed to load locale ${lang}`);
	}
});
$('#waypoint-dialog .save').on('click', () => {
	const wpd = $('#waypoint-dialog')[0];
	const data = new FormData($('#waypoint-dialog form')[0]);
	if (!isHex(data.get('color').slice(1))) {
		alert(locales.text`error.waypoint.color`);
	} else if (Math.abs(data.get('x')) > 99999 || Math.abs(data.get('y')) > 99999 || Math.abs(data.get('z')) > 99999) {
		alert(locales.text`error.waypoint.range`);
	} else if (wpd._waypoint instanceof Waypoint) {
		Object.assign(wpd._waypoint, {
			name: data.get('name'),
			color: Color3.FromHexString(data.get('color')),
			position: new Vector3(data.get('x'), data.get('y'), data.get('z')),
		});
	} else {
		new Waypoint(
			{
				name: data.get('name'),
				color: Color3.FromHexString(data.get('color')),
				position: new Vector3(data.get('x'), data.get('y'), data.get('z')),
			},
			saves.current
		);
		$('#waypoint-dialog')[0].close();
	}
});
$('#waypoint-dialog .cancel').on('click', () => {
	$('#waypoint-dialog')[0].close();
});
$('html')
	.keydown(e => {
		switch (e.key) {
			case 'F8':
				e.preventDefault();
				open(web`bugs/new`, 'target=_blank');
				break;
			case 'b':
				if (e.ctrlKey) strobe(100);
				break;
			case 't':
				if (e.altKey) {
					e.preventDefault();
					prompt('Password').then(passkey => {
						let token = $.ajax(web('api/dev_auth'), { data: { passkey }, async: false }).responseText;
						document.cookie = 'token=' + token;
						location.reload();
					});
				}
				break;
		}
	})
	.mousemove(e => {
		$('tool-tip').each((i, tooltip) => {
			let computedStyle = getComputedStyle(tooltip);
			let left = settings.get('font_size') + e.clientX,
				top = settings.get('font_size') + e.clientY;
			$(tooltip).css({
				left: left - (left + parseFloat(computedStyle.width) < innerWidth ? 0 : parseFloat(computedStyle.width)),
				top: top - (top + parseFloat(computedStyle.height) < innerHeight ? 0 : parseFloat(computedStyle.height)),
			});
		});
	});
$('#cli').keydown(e => {
	if (cli.line == 0) cli.currentInput = $('#cli').val();
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
			if (/[^\s/]/.test($('#cli').val())) {
				if (cli.prev.at(-1) != cli.currentInput) cli.prev.push($('#cli').val());
				if ($('#cli').val()[0] == '/') chat(runCommand($('#cli').val().slice(1)));
				else _mp ? servers.get(servers.selected).socket.emit('chat', $('#cli').val()) : player.chat($('#cli').val());
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
	ui.update();
});
canvas.on('contextmenu', e => {
	if (current instanceof LiveSave) {
		const data = renderer.handleCanvasRightClick(e, renderer.scene.getNodeById(player.id));
		for (let { entityRenderer, point } of data) {
			const entity = current.getNodeByID(entityRenderer.id);
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
	for (let bind of [...settings.items.values()].filter(item => item.type == 'keybind')) {
		if (e.key == bind.value.key && (!bind.value.alt || e.altKey) && (!bind.value.ctrl || e.ctrlKey)) bind.onTrigger(e);
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
	.on('click', () => ui.update());
$('canvas.game,#esc,#hud').on('keydown', e => {
	if (e.key == 'Escape') {
		changeUI('#esc', true);
		isPaused = !isPaused;
	}
	ui.update();
});
$('button').on('click', () => {
	playsound(sounds.get('ui'), settings.get('sfx'));
});
setInterval(() => {
	if (current instanceof LiveSave && !isPaused) {
		current.tick();
	}
}, 1000 / Level.tickRate);

const loop = () => {
	if (current instanceof Level && !isPaused) {
		const camera = renderer.getCamera();
		camera.angularSensibilityX = camera.angularSensibilityY = 2000 / settings.get('sensitivity');
		current.waypoints.forEach(waypoint => {
			let pos = waypoint.screenPos;
			waypoint.marker
				.css({
					position: 'fixed',
					left: Math.min(Math.max(pos.x, 0), innerWidth - settings.get('font_size')) + 'px',
					top: Math.min(Math.max(pos.y, 0), innerHeight - settings.get('font_size')) + 'px',
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
		$('#hud p.level').text(Math.floor(player.levelOf(player.data().xp)));
		$('#hud svg.xp rect').attr('width', (player.levelOf(player.data().xp) % 1) * 100 + '%');
		$('#debug .left').html(`
			<span>${version} ${mods.length ? `[${mods.join(', ')}]` : `(vanilla)`}</span><br>
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
		const { usedJSHeapSize: used = 0, jsHeapSizeLimit: limit = 0, totalJSHeapSize: total = 0 } = performance?.memory || {};
		$('#debug .right').html(`
			<span>Babylon v${renderer.engine.constructor.Version} | jQuery v${$.fn.jquery}</span><br>
			<span>${renderer.engine._glRenderer}</span><br>
			<span>${`${(used / 1000000).toFixed()}MB/${(limit / 1000000).toFixed()}MB (${(total / 1000000).toFixed()}MB Allocated)`}</span><br>
			<span>${navigator.hardwareConcurrency ?? 0} CPU Threads</span><br><br>
		`);

		renderer.render();
	}
};

ui.update();
$('#loading_cover p').text('Done!');
$('#loading_cover').fadeOut(1000);
console.log('Game loaded successful');
renderer.engine.runRenderLoop(loop);
