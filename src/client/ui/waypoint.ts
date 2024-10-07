import { Matrix, Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { type Waypoint } from '~/core/entities/waypoint';
import { scene } from '~/renderer';
import * as settings from '../settings';
import { player, system } from '../user';
import { minimize } from '../utils';
import { confirm } from './dialog';
import { instaniateTemplate } from './utils';

export function createWaypointListItem(waypoint: Waypoint): JQuery<HTMLDivElement> {
	const instance = instaniateTemplate('#waypoint-li').find('div');

	instance.find('.edit').on('click', () => {
		const dialog = $<HTMLDialogElement & { _waypoint: Waypoint }>('#waypoint-dialog')[0];
		dialog._waypoint = waypoint;
		dialog.showModal();
	});
	instance.find('.trash').on('click', async e => {
		if (e.shiftKey || (await confirm('Are you sure?'))) {
			waypoint.remove();
			instance.remove();
		}
	});

	instance.find('.name').text(waypoint.name);
	instance.find('svg.icon').css('fill', waypoint.color);
	instance.find('use.icon').attr('href', 'assets/images/icons.svg#' + (waypoint.icon || 'location-dot'));

	if (waypoint.readonly) {
		instance.find('span.clickable').hide();
	}

	instance.appendTo('#waypoint-list');
	return instance;
}

export function createWaypointMarker(): JQuery<HTMLDivElement> {
	const instance = instaniateTemplate('#waypoint-marker').find('div');
	instance.hide().appendTo('#hud');
	return instance;
}

export class WaypointUI {
	public readonly li: JQuery<HTMLDivElement>;
	public readonly marker: JQuery<HTMLDivElement>;

	public get screenPos(): Vector3 {
		const viewport = new Viewport(0, 0, innerWidth, innerHeight);
		return Vector3.Project(this.target.position, Matrix.Identity(), scene.getTransformMatrix(), viewport);
	}

	protected active: boolean = false;

	public constructor(public readonly target: Waypoint) {
		this.li = createWaypointListItem(target);
		this.marker = createWaypointMarker()
			.on('mouseenter', () => (this.active = true))
			.on('mouseleave', () => (this.active = false));

		this.update();
		target.on('update', () => this.update());
	}

	public update(): void {
		this.marker.css({
			left: Math.min(Math.max(this.screenPos.x, 0), innerWidth - +settings.get('font_size')) + 'px',
			top: Math.min(Math.max(this.screenPos.y, 0), innerHeight - +settings.get('font_size')) + 'px',
			fill: this.target.color,
		});

		this.marker
			.filter('p')
			.text(
				Vector2.Distance(this.screenPos, new Vector2(innerWidth / 2, innerHeight / 2)) < 60 || this.active
					? `${this.target.name} - ${minimize(Vector3.Distance(player().position, this.target.position))} km`
					: ''
			);

		this.marker.find('use').attr('href', 'assets/images/icons.svg#' + this.target.icon);
		this.li.find('.icon use').attr('href', 'assets/images/icons.svg#' + this.target.icon);
		this.li.find('.icon svg').css('fill', this.target.color);
		this.li.find('.name').text(this.target.name);

		if (this.target.system == system()) {
			this.li.show();
			this.marker[this.screenPos.z > 1 && this.screenPos.z < 1.15 ? 'hide' : 'show']();
		} else {
			this.li.hide();
			this.marker.hide();
		}
	}

	public remove() {
		this.marker.remove();
		this.li.remove();
	}
}
