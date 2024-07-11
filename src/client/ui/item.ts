import $ from 'jquery';
import type { Item } from '../../core/generic/items';
import * as locales from '../locales';
import { action } from '../user';
import { instaniateTemplate } from './utils';

export function createItemUI(item: Item): DocumentFragment {
	const instance = instaniateTemplate('#item');
	instance.querySelector('.name')!.textContent = locales.text(`item.${item.id}.name`) + (item.rare ? ' (rare)' : '') + ': ';
	instance.querySelector('.ui-item')!.addEventListener('click', () => action('create_item', item));
	$('div.inventory').append(instance);
	return instance;
}
