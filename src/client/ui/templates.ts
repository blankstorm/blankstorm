import $ from 'jquery';
import type { Shipyard } from '../../core/entities/shipyard';
import type { Item } from '../../core/generic/items';
import type { Research } from '../../core/generic/research';
import type { GenericShip, ShipType } from '../../core/generic/ships';
import { genericShips } from '../../core/generic/ships';
import * as locales from '../locales';
import { action } from '../user';
import { alert } from './dialog';
import { instantiateTemplate } from './utils';

export function createItemUI(item: Item): JQuery<DocumentFragment> {
	const instance = instantiateTemplate('#item');
	instance.find('.name').text(locales.text('item.name', item.id) + (item.rare ? ' (rare)' : '') + ': ');
	instance.find('.ui-item').on('click', () => action('create_item', item));
	$('div.inventory').append(instance);
	return instance;
}

export function createResearchUI(research: Research): JQuery<DocumentFragment> {
	const instance = instantiateTemplate('#research');
	instance.find('.name').text(locales.text('tech.name', research.id));
	instance.find('.upgrade').on('click', () => action('research', research));
	$('div.lab').append(instance);
	return instance;
}

export function createShipUI(ship: GenericShip): JQuery<DocumentFragment> {
	const instance = instantiateTemplate('#ship');
	instance.find('.name').text(locales.text('entity.name', ship.id));
	instance.find('.add').on('click', () => alert('Disabled.'));
	$('div.shipyard').append(instance);
	return instance;
}

export function createShipyardUI(shipyard: Shipyard): JQuery<DocumentFragment> {
	const instance = instantiateTemplate('#shipyard');
	instance
		.find('.add')
		.on('click', () => action('create_ship', { ship: genericShips.get(instance.find('select').val() as ShipType)!, shipyard }));
	instance.find(shipyard.production ? '.non-active' : '.active').hide();
	instance.find(shipyard.production ? '.active' : '.non-active').show();

	if (shipyard.production) {
		instance.find('.active').text('Building: ' + locales.text('entity.name', shipyard.production.id));
	}

	for (const type of genericShips.keys()) {
		$('<option></option>').attr('value', type).text(locales.text('entity.name', type)).appendTo(instance.find('select'));
	}
	return instance;
}
