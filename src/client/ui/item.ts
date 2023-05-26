import type { Item } from '../../core/generic/items';
import type { Player } from '../../core/entities/Player';
import type { Level } from '../../core/Level';
import { locales } from '../locales';
import $ from 'jquery';

export class ItemUI extends HTMLDivElement {
	constructor(item: Item, player: Player, level: Level) {
		super();

		$(`<span style=text-align:right;>${locales.text(`item.${item.id}.name`)}${item.rare ? ` (rare)` : ``}: </span>
		<span class=count style=text-align:left;></span>`).appendTo(this);

		$(this)
			.on('click', () => {
				level.tryPlayerAction(player.id, 'create_item', item);
			})
			.removeAttr('clickable')
			.attr('bg', 'none')
			.appendTo('div.inv');
	}
}
customElements.define('item-ui', ItemUI, { extends: 'div' });
