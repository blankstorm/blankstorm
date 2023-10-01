import type { Berth } from '../../core/stations/Berth';
import $ from 'jquery';
import { genericShips, shipTypes } from '../../core/generic/ships';
import type { ShipType } from '../../core/generic/ships';
import { locales } from '../locales';
import type { Client } from '../client';

export class BerthUI extends HTMLDivElement {
	constructor(berth: Berth, context: Client) {
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
		$(`<p><tool-tip></tool-tip><svg style=font-size:1.5em><use href="_build.asset_dir/images/icons.svg#circle-plus"/></svg></p>`)
			.addClass('non-active add add-or-upgrade-icon')
			.on('click', async () => {
				await context.player.system.tryPlayerAction(context.player.id, 'create_ship', { ship: genericShips[select.val() as ShipType], berth });
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
