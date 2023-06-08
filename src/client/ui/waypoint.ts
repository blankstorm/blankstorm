import $ from 'jquery';
import type { Waypoint } from '../waypoint';
import { confirm } from '../utils';

export class WaypointListItem extends HTMLLIElement {
	constructor(waypoint: Waypoint) {
		super();
		$('<span class="edit" style=text-align:center;;grid-column:2;><svg><use href=images/icons.svg#pencil /></svg></span>')
			.attr('clickable', '')
			.on('click', () => {
				const dialog = $<HTMLDialogElement & { _waypoint: Waypoint }>('#waypoint-dialog')[0];
				dialog._waypoint = waypoint;
				dialog.showModal();
			})
			.appendTo(this);
		$('<span class="trash" style=text-align:center;grid-column:3;><svg><use href=images/icons.svg#trash /></svg></span>')
			.attr('clickable', '')
			.on('click', async () => {
				const yes = await confirm('Are you sure?');
				if (yes) waypoint.remove();
			})
			.appendTo(this);
		$(`<span class="icon" style=text-align:center;grid-column:4;><svg style="fill:${waypoint.color.toHexString()}"><use href=images/icons.svg#${
			waypoint.icon || 'location-dot'
		} /></svg></span>
		<span class="name" style=text-align:left;grid-column:5>${waypoint.name}</span>
		`).appendTo(this);

		$(this).attr('bg', 'none').css({
			display: 'grid',
			'grid-template-columns': 'repeat(4, 1fr) 6fr',
		});
		if (waypoint.readonly) {
			$(this)
				.find('span')
				.filter(i => [0, 1].includes(i))
				.hide();
		}
	}
}
customElements.define('ui-waypoint', WaypointListItem, { extends: 'li' });
