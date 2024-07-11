import $ from 'jquery';
import type { ShipType } from '../../core/generic/ships';
import { genericShips, shipTypes } from '../../core/generic/ships';
import type { Berth } from '../../core/stations/berth';
import * as locales from '../locales';
import { action } from '../user';
import { instaniateTemplate } from './utils';

export function createBerthUI(berth: Berth): DocumentFragment {
	const instance = instaniateTemplate('#berth');
	instance.querySelector('.active')!.textContent = 'Building: ' + locales.text(`entity.${berth.productionID}.name`);
	const select = instance.querySelector('select')!;

	for (const type of shipTypes) {
		$('<option></option>')
			.attr('value', type)
			.text(locales.text(`entity.${type}.name`))
			.appendTo(select);
	}

	instance.querySelector('.add')!.addEventListener('click', () => action('create_ship', genericShips[select.value as ShipType], berth));

	$(instance)
		.find(berth.productionID ? '.non-active' : '.active')
		.hide();
	$(instance)
		.find(berth.productionID ? '.active' : '.non-active')
		.show();
	return instance;
}
