import type { GenericShip } from '../../core/generic/ships';
import type { Player } from '../../core/entities/Player';
import type { Level } from '../../core/Level';
import { locales } from '../locales';
import $ from 'jquery';

export class ShipUI extends HTMLDivElement {
	constructor(ship: GenericShip, player: Player, level: Level) {
		super();

		$(`
			<span class="locked locked-icon"><svg style=font-size:1.5em><use href=images/icons.svg#lock /></svg></span>
			<span class=name style=text-align:center>${locales.text(`entity.${ship.id}.name`)}</span>
			<span class="add add-or-upgrade-icon"><tool-tip></tool-tip><svg style=font-size:1.5em><use href=images/icons.svg#circle-plus /></svg></span>
		`).appendTo(this);
		$(this)
			.find('.add')
			.on('click', () => {
				level.tryPlayerAction(player.id, 'create_ship', ship);
			})
			.parent()
			.attr('bg', 'none')
			.appendTo('div.yrd');
	}
}
customElements.define('ship-ui', ShipUI, { extends: 'div' });
