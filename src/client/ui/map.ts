import { config } from '../../core/metadata';
import { Node } from '../../core/nodes/Node';
import { Planet } from '../../core/nodes/Planet';
import { Ship } from '../../core/nodes/Ship';
import { Star } from '../../core/nodes/Star';
import { toDegrees } from '../../core/utils';
import { account, system } from '../user';
import { $svg, getColorForBiome } from '../utils';
import { Waypoint } from '../waypoints';
import * as settings from '../settings';
import $ from 'jquery';

export class MapMarker {
	gui = $svg<SVGGElement>('g');

	get markerID(): string {
		return 'map-marker:' + this.target.id;
	}

	get color(): string {
		switch (this.target.nodeType) {
			case 'Star':
			case 'Waypoint':
				return (<Star | Waypoint>this.target).color.toHexString();
			case 'Planet':
				return getColorForBiome((<Planet>this.target).biome);
			case 'Ship':
				return account.id == (<Ship>this.target).owner.id ? '#0f0' : '#f00';
		}
	}

	constructor(public readonly target: Node) {
		this.gui.attr('id', this.markerID).addClass('map-marker').appendTo('#map-markers');
		let internalMarker: JQuery<SVGElement>;
		switch (target.nodeType) {
			case 'Star':
			case 'Planet':
				internalMarker = $svg('circle');
				break;
			case 'Ship':
				internalMarker = $svg('svg').append($svg<SVGPolygonElement>(`polygon`).attr('points', `0,0 10,0 5,15`));
				break;
			case 'Waypoint':
				internalMarker = $svg('svg').append($svg('use'));
				break;
			default:
				throw new TypeError(`Unsupported nodeType for marker: ` + target.nodeType);
		}
		internalMarker.addClass('internal-marker');
		this.gui.append(internalMarker);
		this.update();
	}

	update() {
		if (this.target.nodeType == 'Waypoint') {
			this.gui.find('.internal-marker use').attr({
				href: '_build.asset_dir/images/icons.svg#' + ('icon' in this.target ? this.target.icon : 'location-dot'),
				transform: 'scale(.025)',
			});
		}
		const marker = this.gui.find('.internal-marker');
		const isCircle = marker.is('circle');
		marker.attr({
			[isCircle ? 'cx' : 'x']: this.target.absolutePosition.x,
			[isCircle ? 'cy' : 'y']: this.target.absolutePosition.z, // scale,
		});
		if (isCircle && 'radius' in this.target) {
			marker.attr('r', this.target.radius as number);
		}
		(<JQuery>(marker.is('svg') ? marker : this.gui)).attr('transform', `rotate(${toDegrees(this.target.absoluteRotation.y)})`).css('fill', this.color);
		this.target.system.id == system().id ? this.gui.show() : this.gui.hide();
	}
}

export const supportedMarkerNodeTypes = ['Planet', 'Star', 'Ship', 'Waypoint'];

export function supportsMarkerType(nodeType: string): boolean {
	return supportedMarkerNodeTypes.includes(nodeType);
}

export let x: number = 0;
export let y: number = 0;
export let scale: number = 1;
export let rotation: number = 0;

export function svgX(): number {
	return x * -scale;
}
export function svgY(): number {
	return y * -scale;
}

export const markers: Map<string, MapMarker> = new Map();

export function update(): void {
	$('#map-markers').css({
		translate: `${svgX()}px ${svgY()}px`,
		rotate: rotation + 'rad',
		scale,
	});
	$('#map-info').html(`
		<span>(${x.toFixed(0)}, ${y.toFixed(0)}) ${toDegrees(rotation)}°</span><br>
		<span>${scale.toFixed(1)}x</span>
	`);
	$('#system-info').html(`
		<span><strong>${system().name}</strong></span><br>
		<span>${system().connections.length} hyperspace connection(s)</span>
	`);
	for (const [id, node] of system().nodes) {
		if (!markers.has(id) && supportsMarkerType(node.nodeType)) {
			if (node instanceof Waypoint && node.builtin) {
				continue;
			}
			const marker = new MapMarker(node);
			markers.set(id, marker);
		}
	}

	for (const marker of markers.values()) {
		marker.update();
	}
}

export function registerListeners(): void {
	$('#map,#map-markers').on('keydown', e => {
		const speed = e.shiftKey ? 100 : 10,
			max = config.system_generation.max_size / 2;
		switch (e.key) {
			case settings.get<settings.Keybind>('map_move_left').key:
				x = Math.max(x - speed, -max);
				break;
			case settings.get<settings.Keybind>('map_move_right').key:
				x = Math.min(x + speed, max);
				break;
			case settings.get<settings.Keybind>('map_move_up').key:
				y = Math.max(y - speed, -max);
				break;
			case settings.get<settings.Keybind>('map_move_down').key:
				y = Math.min(y + speed, max);
				break;
		}
		update();
	});

	$('#map,#map-markers').on('wheel', ({ originalEvent: evt }: JQuery.TriggeredEvent & { originalEvent: WheelEvent }) => {
		scale = Math.min(Math.max(scale - Math.sign(evt.deltaY) * 0.1, 0.5), 5);
		update();
	});
}
