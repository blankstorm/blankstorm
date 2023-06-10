import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Node } from '../core/nodes/Node';
import type { SerializedNode } from '../core/nodes/Node';
import $ from 'jquery';

import { scene } from '../renderer/index';
import { WaypointUI } from './ui/waypoint';
import type { ClientLevel } from './ClientLevel';

export interface SerializedWaypoint extends SerializedNode {
	color: number[];
	icon: string;
	readonly: boolean;
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

	declare level: ClientLevel;

	constructor(id: string, public readonly readonly = false, public readonly builtin = false, level: ClientLevel) {
		super(id, level);
		level.waypoints.push(this);
		this.gui = $(new WaypointUI(this));
		this.marker = $<SVGSVGElement>(`<svg><use href=images/icons.svg#location-dot /></svg><p style=justify-self:center></p>`).addClass('marker  ingame').hide().appendTo('body');
		this.marker.filter('p').css('text-shadow', '1px 1px 1px #000');
		level.addEventListener('active', () => {
			this.updateVisibility();
		});
		this.updateVisibility();
	}

	get icon(): string {
		return this.#icon;
	}

	set icon(icon: string) {
		this.#icon = icon;
		this.gui.find('.icon use').attr('href', 'images/icons.svg#' + icon);
		this.marker.find('use').attr('href', 'images/icons.svg#' + icon);
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

	updateVisibility(): void {
		if (this.level.isActive) {
			this.gui.appendTo('#waypoint-list');
			this.marker.show();
		} else {
			this.gui.detach();
			this.marker.hide();
		}
	}

	toJSON(): SerializedWaypoint {
		return Object.assign(super.toJSON(), {
			icon: this.icon,
			color: this.color.asArray(),
			readonly: this.readonly,
		});
	}

	remove() {
		this.marker.remove();
		$(this).remove();
		this.level.waypoints.splice(this.level.waypoints.indexOf(this) - 1, 1);
	}
}
