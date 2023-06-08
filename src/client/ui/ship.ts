import type { GenericShip } from '../../core/generic/ships';
import { locales } from '../locales';
import $ from 'jquery';
import type { UIContext } from './context';

export class ShipUI extends HTMLDivElement {
	constructor(ship: GenericShip, context: UIContext) {
		super();

		$(`
			<span class="locked locked-icon"><svg style=font-size:1.5em><use href=images/icons.svg#lock /></svg></span>
			<span class=name style=text-align:center>${locales.text(`entity.${ship.id}.name`)}</span>
			<span class="add add-or-upgrade-icon"><tool-tip></tool-tip><svg style=font-size:1.5em><use href=images/icons.svg#circle-plus /></svg></span>
		`).appendTo(this);
		$(this)
			.find('.add')
			.on('click', () => {
				context.level.tryPlayerAction(context.playerID, 'create_ship', { ship });
			})
			.parent()
			.attr('bg', 'none')
			.appendTo('div.yrd');
	}
}
customElements.define('ui-ship', ShipUI, { extends: 'div' });
