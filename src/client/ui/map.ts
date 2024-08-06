import $ from 'jquery';
import { toDegrees } from 'utilium';
import type { Entity } from '~/core/entities/entity';
import type { Planet } from '~/core/entities/planet';
import type { Ship } from '~/core/entities/ship';
import type { Star } from '~/core/entities/star';
import type { Waypoint } from '~/core/entities/waypoint';
import { config } from '~/core/metadata';
import { System } from '~/core/system';
import { getCurrentLevel } from '../client';
import * as settings from '../settings';
import { switchTo } from '../ui';
import { account, system } from '../user';
import { $svg, biomeColor } from '../utils';
import { Vector2 } from '@babylonjs/core/Maths/math.vector';

export type MapMode = 'in-system' | 'inter-system';

export class MapMarker {
	public gui = $svg<SVGGElement>('g');

	public get markerID(): string {
		return 'map-marker:' + this.target.id;
	}

	public get color(): string {
		if (this.target instanceof System) {
			return this.target.entity<Star>('.Star').color.toHexString();
		}

		if (this.target.isType<Star>('Star')) {
			return this.target.color.toHexString();
		}

		if (this.target.isType<Waypoint>('Waypoint')) {
			return this.target.color;
		}

		if (this.target.isType<Planet>('Planet')) {
			return biomeColor(this.target.biome);
		}

		if (this.target.isType<Ship>('Ship')) {
			return account.id == this.target?.owner?.id ? '#0f0' : '#f00';
		}

		throw new TypeError('Invalid target type');
	}

	public constructor(public readonly target: Entity | System) {
		this.gui.attr('id', this.markerID).addClass('map-marker').appendTo('#map-markers');
		let internalMarker: JQuery<SVGElement>;
		if (target instanceof System) {
			internalMarker = $svg('circle');
			const { x, y } = target.position;
			for (const connection of target.connections) {
				const connID = connection instanceof System ? connection.id : Vector2.prototype.getHashCode.call(connection);
				const connPosition = connection instanceof System ? connection.position : connection;
				const attributes = { x1: x * 100, y1: y * 100, x2: (connPosition.x || 1) * 100, y2: (connPosition.y || 1) * 100 };
				this.gui.append($svg('line').attr({ ...attributes, class: 'system-connection-x', id: target.id + '-' + connID + '-x' }));
				this.gui.append($svg('line').attr({ ...attributes, class: 'system-connection-y', id: target.id + '-' + connID + '-y' }));
			}
		} else {
			switch (target.entityType) {
				case 'Star':
				case 'Planet':
					internalMarker = $svg('circle');
					break;
				case 'Ship':
					internalMarker = $svg('svg').append($svg<SVGPolygonElement>('polygon').attr('points', `0,0 10,0 5,15`));
					break;
				case 'Waypoint':
					internalMarker = $svg('svg').append($svg('use'));
					break;
				default:
					throw new TypeError('Unsupported nodeType for marker: ' + target.entityType);
			}
		}

		internalMarker.addClass('internal-marker');
		this.gui.append(internalMarker);
		this.update();
	}

	public get mode(): MapMode {
		return this.target instanceof System ? 'inter-system' : 'in-system';
	}

	public update(): void {
		const isSystem = this.target instanceof System;
		if (!isSystem && this.target.entityType == 'Waypoint') {
			this.gui.find('.internal-marker use').attr({
				href: 'assets/images/icons.svg#' + ('icon' in this.target ? this.target.icon : 'location-dot'),
				transform: 'scale(.025)',
			});
		}
		const marker = this.gui.find('.internal-marker');
		const isCircle = marker.is('circle');
		const x = isSystem ? this.target.position.x : this.target.absolutePosition.x;
		const y = isSystem ? this.target.position.y : this.target.absolutePosition.z;
		marker.attr({
			[isCircle ? 'cx' : 'x']: x,
			[isCircle ? 'cy' : 'y']: y, // scale,
		});
		if (isCircle) {
			marker.attr('r', 'radius' in this.target ? (this.target.radius as number) : 25);
		}
		if (isSystem) {
			const { x, y } = this.target.position;
			for (const connection of this.target.connections) {
				const connID = connection instanceof System ? connection.id : Vector2.prototype.getHashCode.call(connection);
				const connPosition = connection instanceof System ? connection.position : connection;
				const attributes = { x1: x * 100, y1: y * 100, x2: (connPosition.x || 1) * 100, y2: (connPosition.y || 1) * 100 };
				$('#' + this.target.id + '-' + connID + '-x').attr(attributes);
				$('#' + this.target.id + '-' + connID + '-y').attr(attributes);
			}
		}
		(<JQuery>(marker.is('svg') ? marker : this.gui)).css({
			rotate: (!isSystem ? this.target.absoluteRotation.y : 0) + 'rad',
			fill: this.color,
		});
		(isSystem ? this.target : this.target.system).id == system().id && this.mode == mode ? this.gui.show() : this.gui.hide();
	}
}

export const supportedMarkerNodeTypes = ['Planet', 'Star', 'Ship', 'Waypoint'];

export function supportsMarkerType(nodeType: string): boolean {
	return supportedMarkerNodeTypes.includes(nodeType);
}

export let x: number = 0;
export let y: number = 0;
export let scale: number = 1;
export const rotation: number = 0;
export let mode: 'in-system' | 'inter-system' = 'in-system';

const modes: MapMode[] = ['in-system', 'inter-system'];

const modeNames: Record<MapMode, string> = {
	'in-system': 'Intra-system',
	'inter-system': 'Inter-system',
};

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
	$('#map-transform-info').html(`
		<span>(${x.toFixed(0)}, ${y.toFixed(0)}) ${toDegrees(rotation)}°</span><br>
		<span>${scale.toFixed(1)}x</span>
	`);
	$('#map-system-info').html(`
		<span><strong>${system().name}</strong></span><br>
		<span>${system().connections.size} hyperspace connection(s)</span>
	`);
	$('#map .mode').text(modeNames[mode]);
	for (const entity of system().entities()) {
		if (markers.has(entity.id) || !supportsMarkerType(entity.entityType)) {
			continue;
		}
		if (entity.isType<Waypoint>('Waypoint') && entity.builtin) {
			continue;
		}
		const marker = new MapMarker(entity);
		markers.set(entity.id, marker);
	}
	for (const [id, system] of getCurrentLevel().systems) {
		if (markers.has(id)) {
			continue;
		}
		const marker = new MapMarker(system);
		markers.set(id, marker);
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
			case 'Escape':
				switchTo('#map');
				break;
		}
		update();
	});

	$('#map,#map-markers').on('wheel', ({ originalEvent }: JQuery.TriggeredEvent) => {
		const original = originalEvent as WheelEvent;
		scale = Math.min(Math.max(scale - Math.sign(original.deltaY) * 0.1, 0.5), 5);
		update();
	});

	$('#map .mode').on('click', () => {
		mode = modes[(modes.indexOf(mode) + 1) % modes.length];
		update();
	});
}
