import $ from 'jquery';
import { Level } from '../../core/Level';
import { settings, _mp, screenshots } from '../index';
import { locales } from '../locales';
import { CelestialBody, items, research, Ship, Player, isResearchLocked, priceOfResearch } from '../../core/index';
import type { ResearchID } from '../../core/index';
import { ItemUI } from './item';
import { minimize, confirm } from '../utils';
import { contextMenu } from './contextmenu';
import type { LiveSave } from '../Save';
import { ResearchUI } from './research';
import { ShipUI } from './ship';

export const item_ui = {},
	tech_ui = {},
	ship_ui = {};
export function init(player: Player, level: LiveSave) {
	for (const [id, item] of Object.entries(items)) {
		item_ui[id] = new ItemUI(item, player, level);
	}
	for (const [id, _research] of Object.entries(research)) {
		tech_ui[id] = new ResearchUI(_research, player, level);
	}
	for (const [type, genericShip] of Object.entries(Ship.generic)) {
		ship_ui[type] = new ShipUI(genericShip, player, level);
	}
}
export function update(player: Player, level: LiveSave) {
	if (level instanceof Level && player instanceof Player) {
		$('div.screenshots').empty();
		$('div.map>:not(button)').detach();
		$('svg.item-bar rect').attr('width', (player.totalItems / player.maxItems) * 100 || 0);
		$('div.item-bar p.label').text(`${minimize(player.totalItems)} / ${minimize(player.maxItems)}`);

		for (const [id, amount] of Object.entries(player.items)) {
			item_ui[id].find('.count').text(minimize(amount));
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
			tech_ui[id]
				.find('.upgrade tool-tip')
				.html(
					`<strong>${locales.text(`tech.${id}.name`)}</strong><br>${locales.text(`tech.${id}.description`)}<br>${
						player.research[id] >= t.max
							? `<strong>Max Level</strong>`
							: `${player.research[id]} <svg><use href=images/icons.svg#arrow-right /></svg> ${player.research[id] + 1}`
					}<br><br><strong>Material Cost:</strong>${materials}<br>${Object.keys(t.requires).length ? `<br><strong>Requires:</strong>` : ``}${requires}${
						settings.get('tooltips') ? '<br>type: ' + id : ''
					}`
				);
			tech_ui[id].find('.locked')[isResearchLocked(id as ResearchID, player) ? 'show' : 'hide']();
		}

		//update ship info
		for (const [id, ship] of Object.entries(Ship.generic)) {
			const materials = Object.entries(ship.recipe).reduce(
				(result, [id, amount]) => `${result}<br>${locales.text(`item.${id}.name`)}: ${minimize(player.items[id])}/${minimize(amount)}`,
				''
			);
			const requires = Object.entries(ship.requires).reduce(
				(result, [id, tech]) =>
					`${result}<br>${tech == 0 ? `Incompatible with ${locales.text(`tech.${id}.name`)}` : `${locales.text(`tech.${id}.name`)}: ${player.research[id]}/${tech}`}`,
				''
			);
			ship_ui[id]
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
			ship_ui[id].find('.locked')[locked ? 'show' : 'hide']();
		}

		for (const waypoint of level.waypoints) {
			waypoint.gui.appendTo('div.map');
			waypoint.marker.show();
		}
		for (const [id, body] of level.bodies) {
			if (body instanceof CelestialBody) {
				$('select.move').append((body.option = $(`<option value=${id}>${body.name}</option>`)));
			}
		}
	}
	$('.marker').hide();

	screenshots.forEach(s => {
		contextMenu(
			$(`<img src=${s} width=256></img>`).appendTo('#q div.screenshots'),
			$('<button><svg><use href=images/icons.svg#download /></svg> Download</button>').on('click', () => {
				$('<a download=screenshot.png></a>').attr('href', s)[0].click();
			}),
			$('<button><svg><use href=images/icons.svg#trash /></svg> Delete</button>').on('click', () => {
				confirm('Are you sure?').then(() => {
					screenshots.splice(screenshots.indexOf(s), 1);
					update(player, level);
				});
			})
		);
	});
	$(':root').css('--font-size', settings.get('font_size') + 'px');
	if (_mp) {
		$('#esc .quit').text('Disconnect');
		$('#esc .options').attr('plot', '12.5px,125px,225px,50px,a');
		$('#esc .quit').attr('plot', '12.5px,187.5px,225px,50px,a');
		$('#esc .save').hide();
	} else {
		$('#esc .quit').text('Exit Game');
		$('#esc .save').attr('plot', '12.5px,125px,225px,50px,a');
		$('#esc .options').attr('plot', '12.5px,187.5px,225px,50px,a');
		$('#esc .quit').attr('plot', '12.5px,250px,225px,50px,a');
		$('#esc .save').show();
	}

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

export function setLast(value) {
	lastUI = value;
}
