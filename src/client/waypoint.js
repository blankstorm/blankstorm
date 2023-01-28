import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Node } from '@babylonjs/core/node.js';

import 'jquery'; /* global $ */

import { isHex, random } from 'core/utils.js';
import { modal } from './utils.js';
import { locales } from './index.js';
import { scene } from './renderer/index.js';

export default class Waypoint extends Node {
	#readonly = false;
	static dialog(wp, level) {
		modal(
			[
				{ name: 'name', placeholder: 'Name', value: wp instanceof Waypoint ? wp.name : null },
				{ name: 'color', type: 'color', value: wp instanceof Waypoint ? wp.color.toHexString() : null },
				{ name: 'x', placeholder: 'X', value: wp instanceof Waypoint ? wp.position.x : null },
				{ name: 'y', placeholder: 'Y', value: wp instanceof Waypoint ? wp.position.y : null },
				{ name: 'z', placeholder: 'Z', value: wp instanceof Waypoint ? wp.position.z : null },
			],
			{ Cancel: false, Save: true }
		).then(data => {
			if (data.result) {
				if (!isHex(data.color.slice(1))) {
					alert(locales.text`error.waypoint.color`);
				} else if (Math.abs(data.x) > 99999 || Math.abs(data.y) > 99999 || Math.abs(data.z) > 99999) {
					alert(locales.text`error.waypoint.range`);
				} else if (wp instanceof Waypoint) {
					Object.assign(wp, {
						name: data.name,
						color: Color3.FromHexString(data.color),
						position: new Vector3(data.x, data.y, data.z),
					});
				} else {
					new Waypoint(
						{
							name: data.name,
							color: Color3.FromHexString(data.color),
							position: new Vector3(data.x, data.y, data.z),
						},
						level
					);
				}
			}
		});
	}
	get readonly() {
		return this.#readonly;
	}
	gui(row) {
		let ui = $(`
				<span style=text-align:center;grid-row:${row};grid-column:2;><svg><use href=images/icons.svg#pencil /></svg></span>
				<span style=text-align:center;grid-row:${row};grid-column:3;><svg><use href=images/icons.svg#trash /></svg></span>
				<span style=text-align:center;grid-row:${row};grid-column:4;><svg><use href=images/icons.svg#${this.icon} /></svg></span>
				<span style=text-align:left;grid-row:${row};grid-column:5;color:${this.color.toHexString()}>${this.name}</span>
			`).attr('bg', 'none');
		ui
			.filter('span')
			.eq(0)
			.attr('clickable', '')
			.click(() => {
				Waypoint.dialog(this);
			}),
			ui
				.filter('span')
				.eq(1)
				.attr('clickable', '')
				.click(() => {
					confirm().then(() => {
						this.marker.remove();
						this.getScene().waypoints.splice(this.getScene().waypoints.indexOf(this), 1);
					});
				});
		return this.readonly ? ui.filter('span:gt(1)') : ui;
	}
	get screenPos() {
		return Vector3.Project(this.position, Matrix.Identity(), this.getScene().getTransformMatrix(), { x: 0, y: 0, width: innerWidth, height: innerHeight });
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
		Object.assign(this, { name, position, color, icon });
		this.marker = $(`<svg ingame><use href=images/icons.svg#${icon} /></svg><p ingame style=justify-self:center></p>`).addClass('marker').hide().appendTo('body');
		this.marker.filter('p').css('text-shadow', '1px 1px 1px #000');
	}
}
