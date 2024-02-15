import type { GenericShip } from '../../core/generic/ships';
import { locales } from '../locales';
import $ from 'jquery';
import { account, system } from '../user';

export class ShipUI extends HTMLDivElement {
	constructor(ship: GenericShip) {
		super();

		$(`
			<span class="locked locked-icon"><svg style=font-size:1.5em><use href="_build.asset_dir/images/icons.svg#lock"/></svg></span>
			<span class=name style=text-align:center>${locales.text(`entity.${ship.id}.name`)}</span>
			<span class="add add-or-upgrade-icon"><tool-tip></tool-tip><svg style=font-size:1.5em><use href="_build.asset_dir/images/icons.svg#circle-plus"/></svg></span>
		`).appendTo(this);
		$(this)
			.find('.add')
			.on('click', async () => {
				await system().tryAction(account.id, 'create_ship', { ship });
			});
		$(this).appendTo('div.shipyard');
	}
}
customElements.define('ui-ship', ShipUI, { extends: 'div' });
