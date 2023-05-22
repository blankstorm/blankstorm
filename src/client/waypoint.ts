import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Node } from '@babylonjs/core/node';
import $ from 'jquery';

import { random } from '../core/utils';
import { scene } from '../renderer/index';
import WaypointListItem from './ui/waypoint';
import type { LiveSave } from './Save';

export class Waypoint extends Node {
	gui: JQuery;
	marker: JQuery;
	position: Vector3;
	color: Color3;
	icon: string;

	#readonly: boolean;

	get readonly(): boolean {
		return this.#readonly;
	}

	get screenPos() {
		const viewport = new Viewport(0, 0, innerWidth, innerHeight);
		return Vector3.Project(this.position, Matrix.Identity(), this.getScene().getTransformMatrix(), viewport);
	}

	get row() {
		return this.level.waypoints.indexOf(this) + 1;
	}

	constructor(
		{
			id = random.hex(32),
			name = 'Waypoint',
			position = Vector3.Zero(),
			color = new Color3(Math.random(), Math.random(), Math.random()),
			icon = 'location-dot',
			readonly = false,
		}: {
			id?: string;
			name?: string;
			position?: Vector3;
			color?: Color3;
			icon?: string;
			readonly?: boolean;
		},
		public level: LiveSave
	) {
		super(id, scene);
		this.name = name;
		this.position = position;
		this.color = color;
		this.icon = icon;
		this.#readonly = readonly;
		level.waypoints.push(this);
		this.gui = $(new WaypointListItem(this));
		this.marker = $(`<svg ingame><use href=images/icons.svg#${icon} /></svg><p ingame style=justify-self:center></p>`).addClass('marker').hide().appendTo('body');
		this.marker.filter('p').css('text-shadow', '1px 1px 1px #000');
	}

	remove() {
		this.marker.remove();
		$(this).remove();
		this.level.waypoints.splice(this.row - 1, 1);
	}

	static dialog(wp) {
		const wpd = $<HTMLDialogElement & { _waypoint: Waypoint }>('#waypoint-dialog')[0];
		wpd._waypoint = wp;
		wpd.showModal();
	}
}
