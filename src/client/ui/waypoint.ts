import { Matrix, Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import $ from 'jquery';
import * as settings from '../settings';
import { player, system } from '../user';
import { $svg, confirm, minimize } from '../utils';
import { type Waypoint } from '../../core/entities/waypoint';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { scene } from '../../renderer';

export class WaypointListItemUI extends HTMLDivElement {
	constructor(public readonly target: Waypoint) {
		super();
		$('<span class="edit" style=text-align:center;grid-column:2;><svg><use href="_build.asset_dir/images/icons.svg#pencil"/></svg></span>')
			.addClass('clickable')
			.on('click', () => {
				const dialog = $<HTMLDialogElement & { _waypoint: Waypoint }>('#waypoint-dialog')[0];
				dialog._waypoint = target;
				dialog.showModal();
			})
			.appendTo(this);
		$('<span class="trash" style=text-align:center;grid-column:3;><svg><use href="_build.asset_dir/images/icons.svg#trash"/></svg></span>')
			.addClass('clickable')
			.on('click', async () => {
				const yes = await confirm('Are you sure?');
				if (yes) target.remove();
			})
			.appendTo(this);
		$(`<span class="icon" style=text-align:center;grid-column:4;><svg style="fill:${target.color}"><use href="_build.asset_dir/images/icons.svg#${
			target.icon || 'location-dot'
		}" /></svg></span>
		<span class="name" style=text-align:left;grid-column:5>${target.name}</span>
		`).appendTo(this);

		$(this).addClass('waypoint-ui bg-normal');
		if (target.readonly) {
			$(this)
				.find('span')
				.filter(i => [0, 1].includes(i))
				.hide();
		}
	}
}
customElements.define('ui-waypoint-li', WaypointListItemUI, { extends: 'div' });

export class WaypointUI extends HTMLDivElement {
	public readonly li: JQuery<WaypointListItemUI>;
	public readonly marker: JQuery<HTMLDivElement>;

	public get screenPos(): Vector3 {
		const viewport = new Viewport(0, 0, innerWidth, innerHeight);
		return Vector3.Project(this.target.position, Matrix.Identity(), scene.getTransformMatrix(), viewport);
	}

	protected active: boolean = false;

	public constructor(public readonly target: Waypoint) {
		super();
		this.li = $(new WaypointListItemUI(target));
		const svg = $svg('svg').append($svg('use').attr('href', $build.asset_dir + '/images/icons.svg#location-dot'));
		this.marker = $<HTMLDivElement>('<div><p style=justify-self:center></p></div>')
			.append(svg)
			.addClass('marker ingame')
			.hide()
			.on('mouseenter', () => (this.active = true))
			.on('mouseleave', () => (this.active = false))
			.appendTo('body');
		this.marker.filter('p').css('text-shadow', '1px 1px 1px #000');
		this.update();

		target.on('update', () => {
			this.update();
		});
	}

	protected _update() {
		this.li.find('.icon use').attr('href', $build.asset_dir + '/images/icons.svg#' + this.target.icon);
		this.marker.find('use').attr('href', $build.asset_dir + '/images/icons.svg#' + this.target.icon);
		this.li.find('.icon svg').css('fill', this.target.color);
		this.li.find('.name').text(this.target.name);
	}

	public update(): void {
		this.marker
			.css({
				position: 'fixed',
				left: Math.min(Math.max(this.screenPos.x, 0), innerWidth - +settings.get('font_size')) + 'px',
				top: Math.min(Math.max(this.screenPos.y, 0), innerHeight - +settings.get('font_size')) + 'px',
				fill: this.target.color,
			})
			.filter('p')
			.text(
				Vector2.Distance(this.screenPos, new Vector2(innerWidth / 2, innerHeight / 2)) < 60 || this.active
					? `${this.target.name} - ${minimize(Vector3.Distance(player().position, this.target.position))} km`
					: ''
			);
		this.marker[this.screenPos.z > 1 && this.screenPos.z < 1.15 ? 'hide' : 'show']();

		if (this.target.system.id == system().id) {
			this.li.appendTo('#waypoint-list');
			this.marker.show();
		} else {
			this.li.detach();
			this.marker.hide();
		}
	}

	public remove() {
		this.marker.remove();
		$(this).remove();
	}
}
customElements.define('ui-waypoint', WaypointUI, { extends: 'div' });
