import $ from 'jquery';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { login } from '@blankstorm/api';
import { items } from '../../core/generic/items';
import { isResearchLocked, priceOfResearch, research } from '../../core/generic/research';
import type { ResearchID } from '../../core/generic/research';
import { genericShips } from '../../core/generic/ships';
import type { Player } from '../../core/nodes/Player';
import { game_url, config, version, versions } from '../../core/metadata';
import { isHex, isJSON, toDegrees } from '../../core/utils';
import { Keybind, settings } from '../settings';
import { locales } from '../locales';
import { ItemUI } from './item';
import { minimize, $svg, upload } from '../utils';
import { ResearchUI } from './research';
import { ShipUI } from './ship';
import { MapMarker } from './map-marker';
import type { Client } from '../client';
import { ClientSystem } from '../system';
import { Waypoint } from '../waypoint';
import { Server } from '../server';
import { Save, LiveSave } from '../saves';
import { ClientLevel } from '../level';
import { playsound } from '../audio';
import * as renderer from '../../renderer';
import { chat_cache_size } from '../config';

export interface Context {
	items: Map<string, ItemUI>;
	research: Map<string, ResearchUI>;
	ships: Map<string, ShipUI>;
	map: {
		x: number;
		y: number;
		get svgX(): number;
		get svgY(): number;
		rotation: number;
		scale: number;
		markers: Map<string, MapMarker>;
	};
	client: Client;
}

export const context: Context = {
	items: new Map(),
	ships: new Map(),
	research: new Map(),
	map: {
		x: 0,
		y: 0,
		scale: 1,
		rotation: 0,
		get svgX() {
			return this.x * -this.scale;
		},
		get svgY() {
			return this.y * -this.scale;
		},
		markers: new Map(),
	},
	client: null,
};

export function init(client: Client) {
	document.title = 'Blankstorm ' + versions.get(version).text;
	$('#main .version a').text(versions.get(version).text).attr('href', `${game_url}/versions#${version}`);
	context.client = client;
	for (const [id, item] of Object.entries(items)) {
		context.items.set(id, new ItemUI(item, client));
	}
	for (const [id, _research] of Object.entries(research)) {
		context.research.set(id, new ResearchUI(_research, client));
	}
	for (const [type, genericShip] of Object.entries(genericShips)) {
		context.ships.set(type, new ShipUI(genericShip, client));
	}
	const size = config.system_generation.max_size;
	$('#map-markers-container').attr('viewBox', `-${size / 2} -${size / 2} ${size} ${size}`);
	const grid = $svg('g') as unknown as JQuery<HTMLElement>;
	grid.css('stroke', 'var(--bg-color)').appendTo('#map-markers');
	for (let i = -size * 2; i < size * 2; i += 100) {
		$svg('line')
			.attr({
				x1: -size * 2,
				x2: size * 2,
				y1: i,
				y2: i,
			})
			.appendTo(grid);
		$svg('line')
			.attr({
				x1: i,
				x2: i,
				y1: -size * 2,
				y2: size * 2,
			})
			.appendTo(grid);
	}
}

export function update(ctx: Client) {
	if (ctx.player.system instanceof ClientSystem) {
		const player = ctx.player.system.level.getNodeSystem(ctx.player.id).getNodeByID<Player>(ctx.player.id);
		$('#waypoint-list div').detach();
		$('svg.item-bar rect').attr('width', (player.totalItems / player.maxItems) * 100 || 0);
		$('div.item-bar p.label').text(`${minimize(player.totalItems)} / ${minimize(player.maxItems)}`);

		for (const [id, amount] of Object.entries(player.items)) {
			$(context.items.get(id)).find('.count').text(minimize(amount));
		}

		//update tech info
		for (const [id, t] of Object.entries(research)) {
			const materials = Object.entries(priceOfResearch(id as ResearchID, player.research[id])).reduce(
				(result, [id, amount]) => result + `<br>${locales.text(`item.${id}.name`)}: ${minimize(player.items[id])}/${minimize(amount)}`,
				''
			);
			const requires = Object.entries(t.requires).reduce(
				(result, [id, amount]) =>
					result + (amount > 0) ? `<br>${locales.text(`tech.${id}.name`)}: ${player.research[id]}/${amount}` : `<br>Incompatible with ${locales.text(`tech.${id}.name`)}`,
				''
			);
			$(context.research.get(id))
				.find('.upgrade tool-tip')
				.html(
					`<strong>${locales.text(`tech.${id}.name`)}</strong><br>${locales.text(`tech.${id}.description`)}<br>${
						player.research[id] >= t.max
							? `<strong>Max Level</strong>`
							: `${player.research[id]} <svg><use href="_build.asset_dir/images/icons.svg#arrow-right"/></svg> ${player.research[id] + 1}`
					}<br><br><strong>Material Cost:</strong>${materials}<br>${Object.keys(t.requires).length ? `<br><strong>Requires:</strong>` : ``}${requires}${
						settings.get('tooltips') ? '<br>type: ' + id : ''
					}`
				);
			$(context.research.get(id)).find('.locked')[isResearchLocked(id as ResearchID, player) ? 'show' : 'hide']();
		}

		//update ship info
		for (const [id, ship] of Object.entries(genericShips)) {
			const materials = Object.entries(ship.recipe).reduce(
				(result, [id, amount]) => `${result}<br>${locales.text(`item.${id}.name`)}: ${minimize(player.items[id])}/${minimize(amount)}`,
				''
			);
			const requires = Object.entries(ship.requires).reduce(
				(result, [id, tech]) =>
					`${result}<br>${tech == 0 ? `Incompatible with ${locales.text(`tech.${id}.name`)}` : `${locales.text(`tech.${id}.name`)}: ${player.research[id]}/${tech}`}`,
				''
			);
			$(context.ships.get(id))
				.find('.add tool-tip')
				.html(
					`${locales.text(`entity.${id}.description`)}<br><br><strong>Material Cost</strong>${materials}<br>${
						Object.keys(ship.requires).length ? `<br><strong>Requires:</strong>` : ``
					}${requires}${settings.get('tooltips') ? '<br>' + id : ''}`
				);

			let locked = false;
			for (const t in ship.requires) {
				if (isResearchLocked(t as ResearchID, player)) locked = true;
			}
			$(context.ships.get(id)).find('.locked')[locked ? 'show' : 'hide']();
		}

		for (const waypoint of ctx.player.system.waypoints) {
			waypoint.updateVisibility();
		}
		$('#map-markers').attr(
			'transform',
			`translate(${context.map.svgX} ${context.map.svgY}) \
			rotate(${toDegrees(context.map.rotation)}) \
			scale(${context.map.scale})`
		);
		$('#map-info').html(`
			<span>(${context.map.x.toFixed(0)}, ${context.map.y.toFixed(0)}) ${toDegrees(context.map.rotation)}°</span><br>
			<span>${context.map.scale.toFixed(1)}x</span>
		`);
		$('#system-info').html(`
			<span><strong>${ctx.player.system.name}</strong></span><br>
			<span>${ctx.player.system.connections.length} hyperspace connection(s)</span>
		`);
		for (const [id, node] of ctx.player.system.nodes) {
			if (!context.map.markers.has(id) && MapMarker.supportsNodeType(node.nodeType)) {
				if (node.nodeType == 'waypoint' && (<Waypoint>node).builtin) {
					continue;
				}
				const marker = new MapMarker(node, ctx);
				context.map.markers.set(id, marker);
			}
		}

		for (const marker of context.map.markers.values()) {
			marker.update();
		}

		if (ctx.currentLevel.isServer) {
			$('#pause .quit').text('Disconnect');
			$('#pause .save').hide();
		} else {
			$('#pause .quit').text('Exit Game');
			$('#pause .save').show();
		}
	}

	$('.marker').hide();

	$(':root').css('--font-size', settings.get('font_size') + 'px');

	$('[plot]').each((i, e) => {
		const plot = $(e)
			.attr('plot')
			.replaceAll(/[\d.]+(px|em)/g, str => parseFloat(str) + str.slice(-2))
			.split(',');

		if (plot[0][0] === 'c' && !plot[0].startsWith('calc')) {
			const left = `${plot[0].slice(1) ? 'calc(' : ''}calc(50% - calc(${plot[2]}/2))${plot[0].slice(1) ? ` + ${plot[0].slice(1)})` : ''}`;
			$(e).css('left', left);
		} else if (plot[0][0] === 'r') {
			$(e).css('right', plot[0].slice(1));
		} else if (plot[0][0] === 'l') {
			$(e).css('left', plot[0].slice(1));
		} else {
			$(e).css('left', plot[0]);
		}

		if (plot[1][0] === 'c' && !plot[1].startsWith('calc')) {
			const top = `${plot[1].slice(1) ? 'calc(' : ''}calc(50% - calc(${plot[3]}/2))${plot[1].slice(1) ? ` + ${plot[1].slice(1)})` : ''}`;
			$(e).css('top', top);
		} else if (plot[1][0] === 'b') {
			$(e).css('bottom', plot[1].slice(1));
		} else if (plot[1][0] === 't') {
			$(e).css('top', plot[1].slice(1));
		} else {
			$(e).css('top', plot[1]);
		}

		$(e).css({
			width: plot[2],
			height: plot[3],
			position: ['absolute', 'fixed', 'relative', 'sticky'].includes(plot[4])
				? plot[4]
				: /^(a|s|f|r)$/.test(plot[4])
				? { a: 'absolute', f: 'fixed', r: 'relative', s: 'sticky' }[plot[4]]
				: 'fixed',
		});
	});
}

let lastUI = '#main';
export function getLast() {
	return lastUI;
}

export function setLast(value: string) {
	lastUI = value;
}

let strobeInterval = null;
function strobe(rate) {
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
}

export function registerListeners(client: Client) {
	$('#main .sp').on('click', () => {
		$('#main').hide();
		$('#save-list').show();
	});
	$('#main .mp').on('click', () => {
		if (client.isMultiplayerEnabled) {
			$('#main').hide();
			$('#server-list').show();
			for (const server of client.servers.values()) {
				server.ping();
			}
		} else {
			$<HTMLDialogElement>('#login')[0].showModal();
		}
	});
	$('#main .options').on('click', () => {
		setLast('#main');
		$('#settings').show();
		update(client);
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
		const server = client.servers.has(id) ? client.servers.get(id) : new Server(url, name, client);
		if (client.servers.has(id)) {
			server.name = name;
			server._url = url;
		}
		update(client);
		$<HTMLDialogElement>('#server-dialog')[0].close();
	});
	$('#server-dialog .cancel').on('click', () => {
		$<HTMLDialogElement>('#server-dialog')[0].close();
	});
	$('#save-edit .save').on('click', () => {
		const id = $('#save-edit .id').val() as string,
			name = $('#save-edit .name').val() as string;
		const save = client.saves.get(id);
		if (client.saves.has(id)) {
			save.data.name = name;
		}
		update(client);
		$<HTMLDialogElement>('#save-edit')[0].close();
	});
	$('#save-edit .cancel').on('click', () => {
		$<HTMLDialogElement>('#save-edit')[0].close();
	});
	$('#save-list button.upload').on('click', async () => {
		const files = await upload('.json');
		const text = await files[0].text();
		if (isJSON(text)) {
			new Save(JSON.parse(text), client);
		} else {
			alert(`Can't load save: not JSON.`);
		}
	});
	$('#server-list button.refresh').on('click', () => {
		client.servers.forEach(server => server.ping());
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
		const live = await LiveSave.CreateDefault(name, client.player.id, client.player.username);
		new Save(live.toJSON(), client);
		client.startPlaying(live);
	});
	$('#pause .resume').on('click', () => {
		$('#pause').hide();
		$('canvas.game').trigger('focus');
		client.unpause();
	});
	$('#pause .save').on('click', client.flushSave.bind(client));
	$('#pause .options').on('click', () => {
		setLast('#pause');
		$('#pause').hide();
		$('#settings').show();
	});
	$('#pause .quit').on('click', () => {
		client.pause();
		$('.ingame').hide();
		if (client.currentLevel.isServer) {
			client.servers.get(client.servers.selected).disconnect();
		} else {
			client.saves.selected = null;
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
				const result = await login(email, password);
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
		$(getLast()).show();
		update(client);
	});
	$('#settings div.general input').on('change', () => update(client));
	$<HTMLInputElement>('#settings div.general select[name=locale]').on('change', e => {
		const lang = e.target.value;
		if (locales.has(lang)) {
			locales.load(lang);
		} else {
			alert('That locale is not loaded.');
			client.logger.warn(`Failed to load locale ${lang}`);
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
			const waypoint =
				wpd[0]._waypoint instanceof Waypoint ? wpd[0]._waypoint : new Waypoint(null, false, false, client.currentLevel.getNodeSystem(client.currentLevel.activePlayer));
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
					open(`${game_url}/bugs/new`, 'target=_blank');
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
	const $chatInput = $('#chat-input');
	$chatInput.on('keydown', e => {
		const chat = client.chatInfo,
			inputValue = $chatInput.val() as string;
		if (chat.index == 0) {
			chat.currentInput = inputValue;
		}
		switch (e.key) {
			case 'Escape':
				client.toggleChatUI();
				break;
			case 'ArrowUp':
				if (chat.index < chat.inputs.length) {
					$chatInput.val(++chat.eggCounter == 69 ? 'nice' : chat.inputs[++chat.index]);
				}
				break;
			case 'ArrowDown':
				chat.eggCounter = 0;
				if (chat.index > 0) {
					$chatInput.val(--chat.index == 0 ? chat.currentInput : chat.inputs[chat.index]);
				}
				break;
			case 'Enter':
				if (/^\s*$/.test(inputValue)) {
					// Prevent empty or whitespace-only messages
					break;
				}
				chat.eggCounter = 0;
				if (chat.inputs[0] != chat.currentInput) {
					chat.inputs.unshift(inputValue);
					if (chat.inputs.length > chat_cache_size) {
						chat.inputs.pop();
					}
				}
				if (inputValue[0] == '/') {
					client.sendChatMessage(client.runCommand(inputValue.slice(1)) as string);
				} else if (client.currentLevel.isServer) {
					client.servers.get(client.servers.selected).socket.emit('chat', inputValue);
				} else {
					client.player.chat(inputValue);
				}
				$chatInput.val('');
				client.toggleChatUI();
				chat.index = 0;
				break;
		}
	});
	$('canvas.game').on('focus', () => {
		renderer.getCamera().attachControl($('canvas.game'), true);
	});
	$('canvas.game').on('click', e => {
		if (!client.isPaused) {
			renderer.getCamera().attachControl($('canvas.game'), true);
		}
		if (!(client.currentLevel instanceof ClientLevel)) {
			client.logger.warn('No active client level');
			return;
		}
		renderer.handleCanvasClick(e, client.player.id);
		update(client);
	});
	$('canvas.game').on('contextmenu', e => {
		if (client.player.id != client.currentLevel.activePlayer) {
			client.logger.warn(`Mismatch: The client's player ID is ${client.player.id} but the current active player ID is ${client.currentLevel.activePlayer}`);
			return;
		}
		if (!(client.currentLevel instanceof ClientLevel)) {
			client.logger.warn('No active client level');
			return;
		}
		const data = renderer.handleCanvasRightClick(e, client.player.id);
		const system = client.currentLevel.getNodeSystem(client.currentLevel.activePlayer);
		system.tryAction(client.player.id, 'move', data);
	});
	$('canvas.game').on('keydown', e => {
		switch (e.key) {
			case 'F3':
				$('#debug').toggle();
			case 'F1':
				e.preventDefault();
				$('#hud,.marker').toggle();
				break;
			case 'F4':
				e.preventDefault();
				client.hitboxesEnabled = !client.hitboxesEnabled;
				renderer.setHitboxes(client.hitboxesEnabled);
				break;
			case 'Tab':
				e.preventDefault();
				if (client.currentLevel.isServer) $('#tablist').show();
				break;
		}
	});
	$('canvas.game,.game-ui,#hud,#tablist').on('keydown', e => {
		for (const setting of [...settings.items.values()].filter(item => item.type == 'keybind')) {
			const bind = setting.value as Keybind;
			if (e.key == bind.key && (!bind.alt || e.altKey) && (!bind.ctrl || e.ctrlKey)) setting.emit('trigger');
		}
	});
	$('canvas.game').on('keyup', e => {
		switch (e.key) {
			case 'Tab':
				e.preventDefault();
				if (client.currentLevel.isServer) $('#tablist').hide();
				break;
		}
	});

	$('#ingame-temp-menu')
		.on('keydown', e => {
			if (e.key == settings.get('toggle_temp_menu') || e.key == 'Escape') {
				client.changeUI('#ingame-temp-menu');
			}
		})
		.on('click', () => update(client));
	$('canvas.game,#pause,#hud').on('keydown', e => {
		if (e.key == 'Escape') {
			client.changeUI('#pause', true);
			client.isPaused ? client.unpause() : client.pause();
		}
		update(client);
	});
	$('button').on('click', () => {
		playsound('ui', +settings.get('sfx'));
	});
}
