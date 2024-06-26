import $ from 'jquery';
import type { ShipType } from '../../core/generic/ships';
import { genericShips, shipTypes } from '../../core/generic/ships';
import type { Berth } from '../../core/stations/berth';
import * as locales from '../locales';
import { action } from '../user';

export class BerthUI extends HTMLDivElement {
	constructor(berth: Berth) {
		super();
		$(this).addClass('content bg-transparent');
		$(`<p></p>`)
			.addClass('active')
			.text('Building: ' + locales.text(`entity.${berth.productionID}.name`))
			.appendTo(this);
		const select = $<HTMLSelectElement>('<select></select>').appendTo(this);
		for (const type of shipTypes) {
			$(`<option></option>`)
				.attr('value', type)
				.text(locales.text(`entity.${type}.name`))
				.appendTo(select);
		}
		$(`<p><tool-tip></tool-tip><svg style=font-size:1.5em><use href="assets/images/icons.svg#circle-plus"/></svg></p>`)
			.addClass('non-active add add-or-upgrade-icon')
			.on('click', async () => {
				await action('create_ship', genericShips[select.val() as ShipType], berth);
			})
			.appendTo(this);

		$(this)
			.find(berth.productionID ? '.non-active' : '.active')
			.hide();
		$(this)
			.find(berth.productionID ? '.active' : '.non-active')
			.show();
	}
}
customElements.define('ui-berth', BerthUI, { extends: 'div' });
