import { Vector3, Matrix, Vector2 } from '@babylonjs/core/Maths/math.vector';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Node } from '../core/entities/Node.glslx';
import type { SerializedNode } from '../core/entities/Node.glslx';
import $ from 'jquery';
import { scene } from '../renderer/index';
import { WaypointUI } from './ui/waypoint';
import type { System } from '../core/System';
import * as user from './user';
import { SerializedCelestialBody } from '../core/entities/CelestialBody';
import { getIconForNode, minimize } from './utils';
import * as settings from './settings';

export interface SerializedWaypoint extends SerializedNode {
	color: number[];
	icon: string;
	readonly: boolean;
	system: string;
}

export class Waypoint extends Node {
	gui: JQuery;
	marker: JQuery<SVGSVGElement>;
	#color: Color3 = new Color3(Math.random(), Math.random(), Math.random());
	#icon = 'location-dot';

	get screenPos() {
		const viewport = new Viewport(0, 0, innerWidth, innerHeight);
		return Vector3.Project(this.position, Matrix.Identity(), scene.getTransformMatrix(), viewport);
	}

	private _active: boolean;

	get active(): boolean {
		return this._active;
	}

	constructor(id: string, public readonly readonly = false, public readonly builtin = false, system: System) {
		super(id, system);
		waypoints.add(this);
		this.gui = $(new WaypointUI(this));
		this.marker = $<SVGSVGElement>(`<svg><use href="_build.asset_dir/images/icons.svg#location-dot /></svg><p style=justify-self:center></p>`)
			.addClass('marker ingame')
			.hide()
			.on('mouseenter', () => (this._active = true))
			.on('mouseleave', () => (this._active = false))
			.appendTo('body');
		this.marker.filter('p').css('text-shadow', '1px 1px 1px #000');
		this.update();
	}

	get icon(): string {
		return this.#icon;
	}

	set icon(icon: string) {
		this.#icon = icon;
		this.gui.find('.icon use').attr('href', '_build.asset_dir/images/icons.svg#' + icon);
		this.marker.find('use').attr('href', '_build.asset_dir/images/icons.svg#' + icon);
	}

	get color(): Color3 {
		return this.#color;
	}

	set color(color: Color3) {
		this.#color = color;
		this.gui.find('.icon svg').css('fill', color.toHexString());
	}

	override get name(): string {
		return super.name;
	}

	override set name(name: string) {
		super.name = name;
		this.gui.find('.name').text(name);
	}

	update(): void {
		this.marker
			.css({
				position: 'fixed',
				left: Math.min(Math.max(this.screenPos.x, 0), innerWidth - +settings.get('font_size')) + 'px',
				top: Math.min(Math.max(this.screenPos.y, 0), innerHeight - +settings.get('font_size')) + 'px',
				fill: this.color.toHexString(),
			})
			.filter('p')
			.text(
				Vector2.Distance(new Vector2(this.screenPos.x, this.screenPos.y), new Vector2(innerWidth / 2, innerHeight / 2)) < 60 || this.active
					? `${this.name} - ${minimize(Vector3.Distance(user.player().position, this.position))} km`
					: ''
			);
		this.marker[this.screenPos.z > 1 && this.screenPos.z < 1.15 ? 'hide' : 'show']();

		if (this.system.id == user.system().id) {
			this.gui.appendTo('#waypoint-list');
			this.marker.show();
		} else {
			this.gui.detach();
			this.marker.hide();
		}
	}

	remove() {
		this.marker.remove();
		$(this).remove();
		waypoints.delete(this);
	}

	toJSON(): SerializedWaypoint {
		return Object.assign(super.toJSON(), {
			icon: this.icon,
			color: this.color.asArray(),
			readonly: this.readonly,
			system: this.system.id,
		});
	}

	static fromJSON(data: SerializedWaypoint, system: System): Waypoint {
		if (system.id != data.system) {
			throw new ReferenceError(`Can't load waypoint, system ID mismatch`);
		}
		const waypoint = new Waypoint(data.id, data.readonly, false, system);
		waypoint.name = data.name;
		waypoint.color = Color3.FromArray(data.color);
		waypoint.position = Vector3.FromArray(data.position);
		return waypoint;
	}

	static FromBody(this: System, body: SerializedCelestialBody): void {
		const waypoint = new Waypoint(null, true, true, this);
		waypoint.name = body.name;
		waypoint.position = Vector3.FromArray(body.position);
		waypoint.color = Color3.FromHexString('#88ddff');
		waypoint.icon = getIconForNode(body);
	}
}

export const waypoints: Set<Waypoint> = new Set();

export function updateAll(): void {
	for (const waypoint of waypoints) {
		waypoint.update();
	}
}
