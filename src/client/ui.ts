import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { login } from '@blankstorm/api';
import $ from 'jquery';
import { isHex, isJSON } from 'utilium';
import type { Player } from '~/core/entities/player';
import { Waypoint } from '~/core/entities/waypoint';
import { items } from '~/core/generic/items';
import type { ResearchID } from '~/core/generic/research';
import { isResearchLocked, research } from '~/core/generic/research';
import { genericShips } from '~/core/generic/ships';
import { Level } from '~/core/level';
import { config, game_url, version, versions } from '~/core/metadata';
import * as renderer from '~/renderer';
import { getCamera } from '~/renderer';
import * as client from './client';
import { isServer } from './config';
import * as locales from './locales';
import * as saves from './saves';
import * as servers from './servers';
import * as settings from './settings';
import { alert, confirm } from './ui/dialog';
import * as map from './ui/map';
import * as templates from './ui/templates';
import * as tooltip from './ui/tooltips';
import { WaypointUI } from './ui/waypoint';
import { account, action, player as getPlayer, hasSystem, system } from './user';
import { $svg, logger, minimize, upload } from './utils';
export { map, templates };

export const UIs: Map<string, JQuery<DocumentFragment>> = new Map();

export const waypoints: Map<string, WaypointUI> = new Map();

export async function init() {
	const options = await $app.options();

	$('#main .version a')
		.text((versions.get(version)?.text || version) + (options.debug ? ' (' + $revision.slice(0, 7) + ')' : ''))
		.attr('href', game_url + '/releases/' + version);

	for (const [id, item] of items) {
		UIs.set(id, templates.createItemUI(item));
	}

	for (const [id, tech] of research) {
		UIs.set(id, templates.createResearchUI(tech));
	}

	for (const [type, ship] of genericShips) {
		UIs.set(type, templates.createShipUI(ship));
	}

	const size = config.system_generation.max_size;
	$('#map-markers-container').attr('viewBox', `-${size / 2} -${size / 2} ${size} ${size}`);
	const grid = $svg<SVGGElement>('g').css('stroke', 'var(--bg-color)').appendTo('#map-markers');
	for (let i = -size * 2; i < size * 2; i += 100) {
		grid.append($svg('line').attr({ x1: -size * 2, x2: size * 2, y1: i, y2: i }), $svg('line').attr({ x1: i, x2: i, y1: -size * 2, y2: size * 2 }));
	}
}

export function update() {
	$('.marker').hide();

	$(':root').css('--font-size', settings.get<number>('font_size') + 'px');

	if (!hasSystem()) {
		return;
	}

	const player: Player = getPlayer();
	$('svg.item-bar rect').attr('width', (player.storage.count() / player.storage.max) * 100 || 0);
	$('div.item-bar .label').text(minimize(player.storage.count()) + ' / ' + minimize(player.storage.max));

	for (const [id, amount] of player.storage) {
		$(UIs.get(id)!).find('.count').text(minimize(amount));
	}

	//update research
	for (const tech of research.values()) {
		$(UIs.get(tech.id)!).find('.upgrade tool-tip').html(tooltip.research(tech, player));
		$(UIs.get(tech.id)!).find('.locked')[isResearchLocked(tech.id, player) ? 'show' : 'hide']();
	}

	//update ships
	for (const ship of genericShips.values()) {
		$(UIs.get(ship.id)!)
			.find('.add tool-tip')
			.html(locales.text('entity.description', ship.id) + tooltip.productRequirements(ship, player));

		const locked = Object.keys(ship.requires).some(tech => isResearchLocked(tech as ResearchID, player));
		$(UIs.get(ship.id)!).find('.locked')[locked ? 'show' : 'hide']();
	}

	for (const waypoint of system().entities<Waypoint>('.Waypoint')) {
		if (!waypoints.has(waypoint.id)) {
			waypoints.set(waypoint.id, new WaypointUI(waypoint));
		}
	}
	for (const waypoint of waypoints.values()) {
		waypoint.update();
	}
	map.update();

	if (isServer) {
		$('#pause .quit').text('Disconnect');
		$('#pause .save').hide();
	} else {
		$('#pause .quit').text('Exit Game');
		$('#pause .save').show();
	}
}

let lastUI = '#main';
export function getLast() {
	return lastUI;
}

export function setLast(value: string) {
	lastUI = value;
}

let strobeInterval: NodeJS.Timeout | number | null = null;
function strobe(rate: number) {
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

export function switchTo(selector: string, hideAll?: boolean) {
	if ($(selector).is(':visible')) {
		$('canvas.game').trigger('focus');
		$(selector).hide();
	} else if ($('.game-ui').not(selector).is(':visible') && hideAll) {
		$('canvas.game').trigger('focus');
		$('.game-ui').hide();
	} else if (!$('.game-ui').is(':visible')) {
		getCamera().detachControl();
		$(selector).show().trigger('focus');
	}
}

export function registerListeners() {
	$('#main .singleplayer').on('click', () => {
		$('#main').hide();
		$('#saves').show();
	});
	$('#main .multiplayer').on('click', () => {
		if (!client.isMultiplayerEnabled) {
			$<HTMLDialogElement>('#login')[0].showModal();
			return;
		}
		$('#main').hide();
		$('#servers').show();
		void servers.pingAll();
	});
	$('#main .options').on('click', () => {
		setLast('#main');
		$('#settings').show();
		update();
	});
	$('#main .exit').on('click', () => {
		logger.debug('Quitting...');
		close();
	});
	$('.playable-list .back').on('click', () => {
		$('.playable-list').hide();
		$('#main').show();
	});
	$('#saves .new').on('click', () => {
		$<HTMLDialogElement>('#save-new')[0].showModal();
	});
	$('#servers .new').on('click', () => {
		$('#server-dialog').find('.name').val('');
		$('#server-dialog').find('.url').val('');
		$<HTMLDialogElement>('#server-dialog')[0].showModal();
	});
	$('#server-dialog .save').on('click', () => {
		const name = $('#server-dialog .name').val() as string,
			url = $('#server-dialog .url').val() as string,
			id = servers.getID(url);
		if (!servers.has(id)) {
			servers.add(name, url);
		} else {
			const server = servers.get(id);
			server.name = name;
			server.url = url;
		}

		update();
		$<HTMLDialogElement>('#server-dialog')[0].close();
	});
	$('#server-dialog .cancel').on('click', () => {
		$<HTMLDialogElement>('#server-dialog')[0].close();
	});
	$('#save-edit .save').on('click', () => {
		const id = $('#save-edit .id').val() as string,
			name = $('#save-edit .name').val() as string;
		const save = saves.get(id);
		if (save) {
			save.name = name;
			logger.debug(`Renamed save ${save.id} to "${name}"`);
			saves.update(save);
		}
		update();
		$<HTMLDialogElement>('#save-edit')[0].close();
	});
	$('#save-edit .cancel').on('click', () => {
		$<HTMLDialogElement>('#save-edit')[0].close();
	});
	$('#saves button.upload').on('click', async () => {
		const file = await upload('.json');
		const text = await file.text();
		if (isJSON(text)) {
			saves.add(JSON.parse(text));
		} else {
			void alert(locales.text('save_not_json'));
		}
	});
	$('#servers button.refresh').on('click', servers.pingAll);
	$('#connect button.cancel').on('click', () => {
		$('#servers').show();
		$('#connect').hide();
	});
	$('#save-new button.back').on('click', () => {
		$<HTMLDialogElement>('#save-new')[0].close();
	});
	$('#save-new .new').on('click', async () => {
		$<HTMLDialogElement>('#save-new')[0].close();
		const name = $('#save-new .name').val() as string;
		const live = await saves.createDefault(name);
		saves.add(live.toJSON());
		client.load(live);
	});
	$('#pause .resume').on('click', () => {
		$('#pause').hide();
		$('canvas.game').trigger('focus');
		client.unpause();
	});
	$('#pause .save').on('click', saves.flush);
	$('#pause .options').on('click', () => {
		setLast('#pause');
		$('#pause').hide();
		$('#settings').show();
	});
	$('#pause .quit').on('click', client.unload);
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
				await alert(`Welcome, ${result.username}! ` + locales.text('logged_in_message'));
				location.reload();
			} catch (e) {
				logger.warn('Authentication failed: ' + e);
				$('#login')
					.find('.error')
					.text(e + '')
					.show();
			}
		});
	$('#ingame-temp-menu div.nav button').on('click', e => {
		const section = $(e.target).closest('button[section]').attr('section');
		$(`#ingame-temp-menu > div:not(.nav)`).hide();
		$('#ingame-temp-menu > div.' + section).css('display', 'flex');
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
	$('#settings-nav button[section]').on('click', e => {
		const target = $(e.target),
			button = target.is('button') ? target : target.parent('button');
		$('#settings form[section]')
			.hide()
			.filter(`[section=${button.attr('section')}]`)
			.css('display', 'flex');
	});

	$('#settings button.back').on('click', () => {
		$('#settings').hide();
		$(getLast()).show();
		update();
	});
	$('#settings button.reset').on('click', async event => {
		if (event.shiftKey || (await confirm(locales.text('reset_settings')))) {
			settings.reset();
			update();
		}
	});
	$('#settings div.general input').on('change', update);
	$<HTMLInputElement>('#settings div.general select[name=locale]').on('change', e => {
		const lang = e.target.value;
		if (locales.has(lang)) {
			locales.use(lang);
		} else {
			void alert(locales.text('locale_not_loaded'));
			logger.warn('Failed to load locale: ' + lang);
		}
	});
	$('#waypoint-dialog .save').on('click', () => {
		const wpd = $<HTMLDialogElement & { _waypoint?: Waypoint }>('#waypoint-dialog');
		const x = +(wpd.find('[name=x]').val() || 0),
			y = +(wpd.find('[name=y]').val() || 0),
			z = +(wpd.find('[name=z]').val() || 0),
			color = wpd.find('[name=color]').val() as string,
			name = wpd.find('[name=name]').val() as string;
		if (!isHex(color.slice(1))) {
			void alert(locales.text('error.waypoint.color'));
		} else if (Math.abs(x) > 99999 || Math.abs(y) > 99999 || Math.abs(z) > 99999) {
			void alert(locales.text('error.waypoint.range'));
		} else {
			const waypoint = wpd[0]._waypoint instanceof Waypoint ? wpd[0]._waypoint : new Waypoint(undefined, system());
			waypoint.name = name;
			waypoint.color = color;
			waypoint.position = new Vector3(x, y, z);
			$<HTMLDialogElement>('#waypoint-dialog')[0].close();
			update();
		}
	});
	$('#waypoint-dialog .cancel').on('click', () => {
		$<HTMLDialogElement>('#waypoint-dialog')[0].close();
	});
	map.registerListeners();
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
				const left = settings.get<number>('font_size') + e.clientX,
					top = settings.get<number>('font_size') + e.clientY;
				$(tooltip).css({
					left: left - (left + parseFloat(computedStyle.width) < innerWidth ? 0 : parseFloat(computedStyle.width)),
					top: top - (top + parseFloat(computedStyle.height) < innerHeight ? 0 : parseFloat(computedStyle.height)),
				});
			});
		});
	$('canvas.game').on('focus', () => renderer.getCamera().attachControl(true));
	$('canvas.game').on('click', e => {
		if (!client.isPaused) {
			renderer.getCamera().attachControl(true);
		}
		if (!(client.currentLevel instanceof Level)) {
			logger.warn('No active client level');
			return;
		}
		renderer.handleCanvasClick(e, account.id);
		update();
	});
	$('canvas.game').on('contextmenu', e => {
		if (!(client.currentLevel instanceof Level)) {
			logger.warn('No active level');
			return;
		}
		const data = renderer.handleCanvasRightClick(e, account.id);
		void action('move', data);
	});
	$('canvas.game').on('keydown', e => {
		switch (e.key) {
			case 'F3':
				$('#debug').toggle();
				break;
			case 'F1':
				e.preventDefault();
				$('#hud,.marker').toggle();
				break;
			case 'F4':
				e.preventDefault();
				client.toggleHitboxes();
				renderer.setHitboxes(client.hitboxesEnabled);
				break;
			case 'Tab':
				e.preventDefault();
				if (isServer) $('#tablist').show();
				break;
		}
	});
	$('canvas.game,.game-ui,#hud,#tablist').on('keydown', e => {
		for (const setting of [...settings.items.values()].filter(item => item.type == 'keybind')) {
			const { key, alt, ctrl } = setting.value as settings.Keybind;
			if (e.key == key && (!alt || e.altKey) && (!ctrl || e.ctrlKey)) setting.onTrigger?.(e);
		}
	});
	$('canvas.game').on('keyup', e => {
		switch (e.key) {
			case 'Tab':
				e.preventDefault();
				if (isServer) $('#tablist').hide();
				break;
		}
	});

	$('#ingame-temp-menu')
		.on('keydown', e => {
			if (e.key == settings.get('toggle_temp_menu') || e.key == 'Escape') {
				switchTo('#ingame-temp-menu');
			}
		})
		.on('click', update);
	$('canvas.game,#pause,#hud').on('keydown', e => {
		if (e.key == 'Escape') {
			switchTo('#pause', true);
			client.isPaused ? client.unpause() : client.pause();
		}
		update();
	});
}
