import $ from 'jquery';
import type { Item } from '../../core/generic/items';
import * as locales from '../locales';
import { action } from '../user';

export function createItemUI(item: Item): DocumentFragment {
	const instance = $<HTMLTemplateElement>('#item')[0].content.cloneNode(true) as DocumentFragment;
	instance.querySelector('.name')!.textContent = locales.text(`item.${item.id}.name`) + (item.rare ? ' (rare)' : '') + ': ';
	instance.querySelector('.item')!.addEventListener('click', () => action('create_item', item));
	$('div.inventory').append(instance);
	return instance;
}
