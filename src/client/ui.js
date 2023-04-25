import $ from 'jquery';
import Level from '../core/Level.js';
import { locales, saves, servers, settings, mp, screenshots, current } from './index.js';
import { versions, CelestialBody, Items, Tech, Ship, Player } from '../core/index.js';
import { minimize, confirm } from './utils.js';

import { player } from './index.js'; //Temporary

const item_ui = {},
	tech_ui = {},
	ship_ui = {};
export function init() {
	for (let [id, item] of Items) {
		item_ui[id] = $(`<div>
						<span style=text-align:right;>${locales.text(`item.${id}.name`)}${item.rare ? ` (rare)` : ``}: </span>
						<span class=count style=text-align:left;></span>
					</div>`)
			.click(() => {
				if (item.recipe && player.data().hasItems(item.recipe)) {
					player.data().removeItems(item.recipe);
					player.data().items[id]++;
				}
			})
			.removeAttr('clickable')
			.attr('bg', 'none')
			.appendTo('div.inv');
	}
	for (let [id, t] of Tech) {
		tech_ui[id] = $(`<div>
						<span class="locked locked-icon"><svg style=font-size:1.5em><use href=images/icons.svg#lock /></svg></span>
						<span class=name style=text-align:center;>${locales.text(`tech.${id}.name`)}</span>
						<span class="upgrade add-or-upgrade-icon"><tool-tip></tool-tip><svg style=font-size:1.5em><use href=images/icons.svg#circle-up /></svg></span>
					</div>`)
			.find('.upgrade')
			.click(() => {
				if (
					player.data().hasItems(Tech.priceOf(id, player.data().tech[id])) &&
					player.data().tech[id] < t.max &&
					!Tech.isLocked(id, player.data()) &&
					player.data().xpPoints >= 1
				) {
					player.data().removeItems(Tech.priceOf(id, player.data().tech[id]));
					player.data().tech[id]++;
					player.data().xpPoints--;
				}
				update();
			})
			.parent()
			.attr('bg', 'none')
			.appendTo('div.lab');
	}
	for (let [type, ship] of Ship.generic) {
		ship_ui[type] = $(`<div>
						<span class="locked locked-icon"><svg style=font-size:1.5em><use href=images/icons.svg#lock /></svg></span>
						<span class=name style=text-align:center>${locales.text(`entity.${type}.name`)}</span>
						<span class="add add-or-upgrade-icon"><tool-tip></tool-tip><svg style=font-size:1.5em><use href=images/icons.svg#circle-plus /></svg></span>
					</div>`)
			.find('.add')
			.click(() => {
				if (player.data().hasItems(ship.recipe)) {
					player.data().removeItems(ship.recipe);
					const ship = new Ship(null, player.data().level, { type, power: player.data().power });
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
	try {
		if (current instanceof Level && player.data() instanceof Player) {
			$('div.screenshots').empty();
			$('div.map>:not(button)').remove();
			$('svg.item-bar rect').attr('width', (player.data().totalItems / player.data().maxItems) * 100 || 0);
			$('div.item-bar p.label').text(`${minimize(player.data().totalItems)} / ${minimize(player.data().maxItems)}`);

			for (let [id, amount] of Object.entries(player.data().items)) {
				item_ui[id].find('.count').text(minimize(amount));
			}

			//update tech info
			for (let [id, t] of Tech) {
				const materials = Object.entries(Tech.priceOf(id, player.data().tech[id])).reduce(
					(result, [id, amount]) => result + `<br>${locales.text(`item.${id}.name`)}: ${minimize(player.data().items[id])}/${minimize(amount)}`,
					''
				);
				const requires = Object.entries(t.requires).reduce(
					(result, [id, amount]) =>
						result + (amount > 0)
							? `<br>${locales.text(`tech.${id}.name`)}: ${player.data().tech[id]}/${amount}`
							: `<br>Incompatible with ${locales.text(`tech.${id}.name`)}`,
					''
				);
				tech_ui[id]
					.find('.upgrade tool-tip')
					.html(
						`<strong>${locales.text(`tech.${id}.name`)}</strong><br>${locales.text(`tech.${id}.description`)}<br>${
							player.data().tech[id] >= t.max
								? `<strong>Max Level</strong>`
								: `${player.data().tech[id]} <svg><use href=images/icons.svg#arrow-right /></svg> ${player.data().tech[id] + 1}`
						}<br><br><strong>Material Cost:</strong>${materials}<br>${Object.keys(t.requires).length ? `<br><strong>Requires:</strong>` : ``}${requires}${
							settings.get('tooltips') ? '<br>type: ' + id : ''
						}`
					);
				tech_ui[id].find('.locked')[Tech.isLocked(id, player.data()) ? 'show' : 'hide']();
			}

			//update ship info
			for (let [id, ship] of Ship.generic) {
				const materials = Object.entries(ship.recipe).reduce(
					(result, [id, amount]) => `${result}<br>${locales.text(`item.${id}.name`)}: ${minimize(player.data().items[id])}/${minimize(amount)}`,
					''
				);
				const requires = Object.entries(ship.requires).reduce(
					(result, [id, tech]) =>
						`${result}<br>${
							tech == 0 ? `Incompatible with ${locales.text(`tech.${id}.name`)}` : `${locales.text(`tech.${id}.name`)}: ${player.data().tech[id]}/${tech}`
						}`,
					''
				);
				ship_ui[id]
					.find('.add tool-tip')
					.html(
						`${locales.text(`entity.${id}.description`)}<br><br><strong>Material Cost</strong>${materials}<br>${
							Object.keys(ship.requires).length ? `<br><strong>Requires:</strong>` : ``
						}${requires}${settings.debug?.tooltips ? '<br>' + id : ''}`
					);

				let locked = false;
				for (let t in ship.requires) {
					if (Tech.isLocked(t, player.data())) locked = true;
				}
				ship_ui[id].find('.locked')[locked ? 'show' : 'hide']();
			}

			scene.waypoints.forEach((wp, i) => {
				wp.gui(i + 1).appendTo('div.map');
				wp.marker.show();
			});
			for (let [id, body] of scene.bodies) {
				if (body instanceof CelestialBody) {
					$('select.move').append((body.option = $(`<option value=${id}>${body.name}</option>`)));
				}
			}
		}
		$('.marker').hide();

		screenshots.forEach(s => {
			$(`<img src=${s} width=256></img>`)
				.appendTo('#q div.screenshots')
				.cm(
					$('<button><svg><use href=images/icons.svg#download /></svg> Download</button>').click(() => {
						$('<a download=screenshot.png></a>').attr('href', s)[0].click();
					}),
					$('<button><svg><use href=images/icons.svg#trash /></svg> Delete</button>').click(() => {
						confirm().then(() => {
							screenshots.splice(screenshots.indexOf(s), 1);
							update();
						});
					})
				);
		});
		servers.forEach(server => {
			server.gui.name.text(server.name);
		});
		saves.forEach(save => {
			save.gui.name.text(save.data.name);
			save.gui.version.text(versions.get(save.data.version)?.text ?? save.data.version);
			save.gui.date.text(new Date(save.data.date).toLocaleString());
		});
		$(':root').css('--font-size', settings.get('font_size') + 'px');
		if (mp) {
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
			let scale =
				settings.get('gui_scale') == 0
					? innerHeight <= 475
						? 0.5
						: innerHeight <= 650
						? 0.75
						: innerHeight <= 800
						? 1
						: 1.25
					: Object.assign([1, 0.75, 1, 1.25][settings.get('gui_scale')], { is_from_array: true });

			let plot = $(e)
				.attr('plot')
				.replaceAll(/[\d.]+(px|em)/g, str => parseFloat(str) * scale + str.slice(-2))
				.split(',');
			plot[0][0] == 'c' && !plot[0].startsWith('calc')
				? $(e).css('left', `${plot[0].slice(1) ? 'calc(' : ''}calc(50% - calc(${plot[2]}/2))${plot[0].slice(1) ? ` + ${plot[0].slice(1)})` : ''}`)
				: plot[0][0] == 'r'
				? $(e).css('right', plot[0].slice(1))
				: plot[0][0] == 'l'
				? $(e).css('left', plot[0].slice(1))
				: $(e).css('left', plot[0]);
			plot[1][0] == 'c' && !plot[1].startsWith('calc')
				? $(e).css('top', `${plot[1].slice(1) ? 'calc(' : ''}calc(50% - calc(${plot[3]}/2))${plot[1].slice(1) ? ` + ${plot[1].slice(1)})` : ''}`)
				: plot[1][0] == 'b'
				? $(e).css('bottom', plot[1].slice(1))
				: plot[1][0] == 't'
				? $(e).css('top', plot[1].slice(1))
				: $(e).css('top', plot[1]);
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
	} catch (err) {
		console.error('Failed to update UI: ' + err.stack);
	}
}

let lastUI = '#main';
export function getLast() {
	return lastUI;
}

export function setLast(value) {
	lastUI = value;
}
