import $ from 'jquery';
import { Level } from '../core/Level';
import { locales, settings, _mp, screenshots, current } from './index';
import { CelestialBody, items, research, Ship, Player, isResearchLocked, priceOfResearch, ResearchID } from '../core/index';
import { minimize, confirm } from './utils';
import { contextMenu } from './ui/contextmenu';

import { player } from './index'; //Temporary
import type { ShipType } from '../core/generic/ships';

const item_ui = {},
	tech_ui = {},
	ship_ui = {};
export function init() {
	for (const [id, item] of Object.entries(items)) {
		item_ui[id] = $(`<div>
						<span style=text-align:right;>${locales.text(`item.${id}.name`)}${item.rare ? ` (rare)` : ``}: </span>
						<span class=count style=text-align:left;></span>
					</div>`)
			.on('click', () => {
				if (item.recipe && player.data().hasItems(item.recipe)) {
					player.data().removeItems(item.recipe);
					player.data().items[id]++;
				}
			})
			.removeAttr('clickable')
			.attr('bg', 'none')
			.appendTo('div.inv');
	}
	for (const [id, t] of Object.entries(research)) {
		tech_ui[id] = $(`<div>
						<span class="locked locked-icon"><svg style=font-size:1.5em><use href=images/icons.svg#lock /></svg></span>
						<span class=name style=text-align:center;>${locales.text(`tech.${id}.name`)}</span>
						<span class="upgrade add-or-upgrade-icon"><tool-tip></tool-tip><svg style=font-size:1.5em><use href=images/icons.svg#circle-up /></svg></span>
					</div>`)
			.find('.upgrade')
			.on('click', () => {
				if (
					player.data().hasItems(priceOfResearch(id as ResearchID, player.data().research[id])) &&
					player.data().research[id] < t.max &&
					!isResearchLocked(id as ResearchID, player.data()) &&
					player.data().xpPoints >= 1
				) {
					player.data().removeItems(priceOfResearch(id as ResearchID, player.data().research[id]));
					player.data().research[id]++;
					player.data().xpPoints--;
				}
				update();
			})
			.parent()
			.attr('bg', 'none')
			.appendTo('div.lab');
	}
	for (const [type, genericShip] of Object.entries(Ship.generic)) {
		ship_ui[type] = $(`<div>
						<span class="locked locked-icon"><svg style=font-size:1.5em><use href=images/icons.svg#lock /></svg></span>
						<span class=name style=text-align:center>${locales.text(`entity.${type}.name`)}</span>
						<span class="add add-or-upgrade-icon"><tool-tip></tool-tip><svg style=font-size:1.5em><use href=images/icons.svg#circle-plus /></svg></span>
					</div>`)
			.find('.add')
			.on('click', () => {
				if (player.data().hasItems(genericShip.recipe)) {
					player.data().removeItems(genericShip.recipe);
					const ship = new Ship(null, player.data().level, { type: type as ShipType, power: player.data().power });
					ship.parent = ship.owner = player.data();
					player.data().fleet.push(ship);
				}
				update();
			})
			.parent()
			.attr('bg', 'none')
			.appendTo('div.yrd');
	}
}
export function update(scene = current) {
	if (current instanceof Level && player.data() instanceof Player) {
		$('div.screenshots').empty();
		$('div.map>:not(button)').detach();
		$('svg.item-bar rect').attr('width', (player.data().totalItems / player.data().maxItems) * 100 || 0);
		$('div.item-bar p.label').text(`${minimize(player.data().totalItems)} / ${minimize(player.data().maxItems)}`);

		for (const [id, amount] of Object.entries(player.data().items)) {
			item_ui[id].find('.count').text(minimize(amount));
		}

		//update tech info
		for (const [id, t] of Object.entries(research)) {
			const materials = Object.entries(priceOfResearch(id as ResearchID, player.data().research[id])).reduce(
				(result, [id, amount]) => result + `<br>${locales.text(`item.${id}.name`)}: ${minimize(player.data().items[id])}/${minimize(amount)}`,
				''
			);
			const requires = Object.entries(t.requires).reduce(
				(result, [id, amount]) =>
					result + (amount > 0)
						? `<br>${locales.text(`tech.${id}.name`)}: ${player.data().research[id]}/${amount}`
						: `<br>Incompatible with ${locales.text(`tech.${id}.name`)}`,
				''
			);
			tech_ui[id]
				.find('.upgrade tool-tip')
				.html(
					`<strong>${locales.text(`tech.${id}.name`)}</strong><br>${locales.text(`tech.${id}.description`)}<br>${
						player.data().research[id] >= t.max
							? `<strong>Max Level</strong>`
							: `${player.data().research[id]} <svg><use href=images/icons.svg#arrow-right /></svg> ${player.data().research[id] + 1}`
					}<br><br><strong>Material Cost:</strong>${materials}<br>${Object.keys(t.requires).length ? `<br><strong>Requires:</strong>` : ``}${requires}${
						settings.get('tooltips') ? '<br>type: ' + id : ''
					}`
				);
			tech_ui[id].find('.locked')[isResearchLocked(id as ResearchID, player.data()) ? 'show' : 'hide']();
		}

		//update ship info
		for (const [id, ship] of Object.entries(Ship.generic)) {
			const materials = Object.entries(ship.recipe).reduce(
				(result, [id, amount]) => `${result}<br>${locales.text(`item.${id}.name`)}: ${minimize(player.data().items[id])}/${minimize(amount)}`,
				''
			);
			const requires = Object.entries(ship.requires).reduce(
				(result, [id, tech]) =>
					`${result}<br>${
						tech == 0 ? `Incompatible with ${locales.text(`tech.${id}.name`)}` : `${locales.text(`tech.${id}.name`)}: ${player.data().research[id]}/${tech}`
					}`,
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
				if (isResearchLocked(t as ResearchID, player.data())) locked = true;
			}
			ship_ui[id].find('.locked')[locked ? 'show' : 'hide']();
		}

		for (const waypoint of scene.waypoints) {
			waypoint.gui.appendTo('div.map');
			waypoint.marker.show();
		}
		for (const [id, body] of scene.bodies) {
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
					update();
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
