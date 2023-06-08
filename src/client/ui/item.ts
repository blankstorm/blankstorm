import type { Item } from '../../core/generic/items';
import { locales } from '../locales';
import $ from 'jquery';
import type { UIContext } from './context';

export class ItemUI extends HTMLDivElement {
	constructor(item: Item, context: UIContext) {
		super();

		$(`<span style=text-align:right;>${locales.text(`item.${item.id}.name`)}${item.rare ? ` (rare)` : ``}: </span>
		<span class=count style=text-align:left;></span>`).appendTo(this);

		$(this)
			.on('click', () => {
				context.level.tryPlayerAction(context.playerID, 'create_item', item);
			})
			.removeAttr('clickable')
			.attr('bg', 'none')
			.appendTo('div.inv');
	}
}
customElements.define('ui-item', ItemUI, { extends: 'div' });
