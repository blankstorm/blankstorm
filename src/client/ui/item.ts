import $ from 'jquery';
import type { Item } from '../../core/generic/items';
import { locales } from '../locales';
import type { Client } from '../client';

export class ItemUI extends HTMLDivElement {
	constructor(item: Item, context: Client) {
		super();

		$('<span></span>')
			.css('text-align', 'right')
			.text(`${locales.text(`item.${item.id}.name`)}${item.rare ? ` (rare)` : ``}: `)
			.appendTo(this);
		$('<span></span>').addClass('count').appendTo(this);

		$(this)
			.on('click', async () => {
				await context.player.system.tryAction(context.player.id, 'create_item', item);
			})
			.addClass('ui-item')
			.appendTo('div.inventory');
	}
}
customElements.define('ui-item', ItemUI, { extends: 'div' });
