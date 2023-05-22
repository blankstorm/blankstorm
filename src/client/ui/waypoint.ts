import $ from 'jquery';
import type { Waypoint } from '../waypoint';

export default class WaypointListItem extends HTMLLIElement {
	constructor(waypoint: Waypoint) {
		super();
		$(`
				<span style=text-align:center;grid-row:${waypoint.row};grid-column:2;><svg><use href=images/icons.svg#pencil /></svg></span>
				<span style=text-align:center;grid-row:${waypoint.row};grid-column:3;><svg><use href=images/icons.svg#trash /></svg></span>
				<span style=text-align:center;grid-row:${waypoint.row};grid-column:4;><svg><use href=images/icons.svg#${waypoint.icon} /></svg></span>
				<span style=text-align:left;grid-row:${waypoint.row};grid-column:5;color:${waypoint.color.toHexString()}>${waypoint.name}</span>
			`).appendTo(this);
		$(this).attr('bg', 'none');
		$(this)
			.filter('span')
			.eq(0)
			.attr('clickable', '')
			.on('click', () => {
				$<HTMLDialogElement>('#waypoint-dialog')[0].showModal();
			}),
			$(this)
				.filter('span')
				.eq(1)
				.attr('clickable', '')
				.on('click', async () => {
					const yes = await confirm('Are you sure?');
					if (yes) waypoint.remove();
				});
		if (waypoint.readonly) {
			$(this).find('span').eq(0).hide();
		}
	}
}
customElements.define('waypoint-list-item', WaypointListItem, { extends: 'li' });
