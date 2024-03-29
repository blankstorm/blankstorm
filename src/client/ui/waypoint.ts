import $ from 'jquery';
import type { Waypoint } from '../waypoints';
import { confirm } from '../utils';

export class WaypointUI extends HTMLDivElement {
	constructor(waypoint: Waypoint) {
		super();
		$('<span class="edit" style=text-align:center;;grid-column:2;><svg><use href="_build.asset_dir/images/icons.svg#pencil"/></svg></span>')
			.addClass('clickable')
			.on('click', () => {
				const dialog = $<HTMLDialogElement & { _waypoint: Waypoint }>('#waypoint-dialog')[0];
				dialog._waypoint = waypoint;
				dialog.showModal();
			})
			.appendTo(this);
		$('<span class="trash" style=text-align:center;grid-column:3;><svg><use href="_build.asset_dir/images/icons.svg#trash"/></svg></span>')
			.addClass('clickable')
			.on('click', async () => {
				const yes = await confirm('Are you sure?');
				if (yes) waypoint.remove();
			})
			.appendTo(this);
		$(`<span class="icon" style=text-align:center;grid-column:4;><svg style="fill:${waypoint.color.toHexString()}"><use href="_build.asset_dir/images/icons.svg#${
			waypoint.icon || 'location-dot'
		}" /></svg></span>
		<span class="name" style=text-align:left;grid-column:5>${waypoint.name}</span>
		`).appendTo(this);

		$(this).addClass('waypoint-ui bg-normal');
		if (waypoint.readonly) {
			$(this)
				.find('span')
				.filter(i => [0, 1].includes(i))
				.hide();
		}
	}
}
customElements.define('ui-waypoint', WaypointUI, { extends: 'div' });
