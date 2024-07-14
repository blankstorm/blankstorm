import { Matrix, Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Viewport } from '@babylonjs/core/Maths/math.viewport';
import { type Waypoint } from '../../core/entities/waypoint';
import { scene } from '../../renderer';
import * as settings from '../settings';
import { player, system } from '../user';
import { minimize } from '../utils';
import { createWaypointListItem, createWaypointMarker } from './templates';

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

		if (this.target.system.id == system().id) {
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
