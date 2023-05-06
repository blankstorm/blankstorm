import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Node } from '@babylonjs/core/node.js';
import $ from 'jquery';

import { random } from '../core/utils.js';
import { scene } from './renderer/index.js';
import WaypointListItem from './ui/waypoint.js';

export default class Waypoint extends Node {
	#readonly = false;
	get readonly() {
		return this.#readonly;
	}

	get screenPos() {
		return Vector3.Project(this.position, Matrix.Identity(), this.getScene().getTransformMatrix(), { x: 0, y: 0, width: innerWidth, height: innerHeight });
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
		},
		level
	) {
		super(id, scene);
		level.waypoints.push(this);
		this.#readonly = readonly;
		Object.assign(this, { name, position, color, icon, level });
		this.gui = $(new WaypointListItem(this));
		this.marker = $(`<svg ingame><use href=images/icons.svg#${icon} /></svg><p ingame style=justify-self:center></p>`).addClass('marker').hide().appendTo('body');
		this.marker.filter('p').css('text-shadow', '1px 1px 1px #000');
	}

	remove() {
		this.marker.remove();
		$(this).remove();
		this.getScene().waypoints.splice(this.row - 1, 1);
	}

	static dialog(wp) {
		const wpd = $('#waypoint-dialog')[0];
		wpd._waypoint = wp;
		wpd.showModal();
	}
}
