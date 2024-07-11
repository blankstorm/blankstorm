import $ from 'jquery';
import type { GenericShip } from '../../core/generic/ships';
import * as locales from '../locales';
import { action } from '../user';
import { instaniateTemplate } from './utils';

export function createShipUI(ship: GenericShip): DocumentFragment {
	const instance = instaniateTemplate('#ship');
	instance.querySelector('.name')!.textContent = locales.text(`entity.${ship.id}.name`);
	instance.querySelector('.add')!.addEventListener('click', () => action('create_ship', ship));
	$('div.shipyard').append(instance);
	return instance;
}
