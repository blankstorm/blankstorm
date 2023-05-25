import type { Item } from '../../core/generic/items';
import { ui } from '../listeners';
import { locales } from '../index';
import $ from 'jquery';

export class ItemUI extends HTMLDivElement {
	constructor(item: Item) {
		super();

		$(`<span style=text-align:right;>${locales.text(`item.${item.id}.name`)}${item.rare ? ` (rare)` : ``}: </span>
		<span class=count style=text-align:left;></span>`).appendTo(this);

		$(this).on('click', item, ui.item).removeAttr('clickable').attr('bg', 'none').appendTo('div.inv');
	}
}
