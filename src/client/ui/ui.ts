import $ from 'jquery';
import { items } from '../../core/generic/items';
import { isResearchLocked, priceOfResearch, research } from '../../core/generic/research';
import type { ResearchID } from '../../core/generic/research';
import { genericShips } from '../../core/generic/ships';
import type { Player } from '../../core/nodes/Player';
import { config } from '../../core/metadata';
import { toDegrees } from '../../core/utils';
import { settings } from '../settings';
import { locales } from '../locales';
import { ItemUI } from './item';
import { minimize, $svg } from '../utils';
import { ResearchUI } from './research';
import { ShipUI } from './ship';
import { Marker } from './marker';
import type { ClientContext } from '../client';
import { ClientSystem } from '../ClientSystem';
import type { Waypoint } from '../waypoint';

export interface Context {
	items: Map<string, ItemUI>;
	research: Map<string, ResearchUI>;
	ships: Map<string, ShipUI>;
	markers: Map<string, Marker>;
	map: {
		x: number;
		y: number;
		get svgX(): number;
		get svgY(): number;
		rotation: number;
		scale: number;
	};
	client: ClientContext;
}

export const context: Context = {
	items: new Map(),
	ships: new Map(),
	research: new Map(),
	markers: new Map(),
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
	},
	client: null,
};

export function init(client: ClientContext) {
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

export function update(ctx: ClientContext) {
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
			if (!context.markers.has(id) && Marker.supportsNodeType(node.nodeType)) {
				if (node.nodeType == 'waypoint' && (<Waypoint>node).builtin) {
					continue;
				}
				const marker = new Marker(node, ctx);
				context.markers.set(id, marker);
			}
		}

		for (const marker of context.markers.values()) {
			marker.update();
		}

		if (ctx.current.isServer) {
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
