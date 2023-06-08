import type { Berth } from '../../core/stations/Berth';
import $ from 'jquery';
import { locales } from '../locales';
import { genericShips, shipTypes } from '../../core/generic/ships';
import type { ShipType } from '../../core/generic/ships';
import type { UIContext } from './context';

export class BerthUI extends HTMLDivElement {
	constructor(berth: Berth, context: UIContext) {
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
		$(`<p><tool-tip></tool-tip><svg style=font-size:1.5em><use href=images/icons.svg#circle-plus /></svg></p>`)
			.addClass('non-active add add-or-upgrade-icon')
			.on('click', () => {
				context.level.tryPlayerAction(context.playerID, 'create_ship', { ship: genericShips[select.val() as ShipType], berth });
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
