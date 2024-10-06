import $ from 'jquery';
import type { Shipyard } from '~/core/entities/station/shipyard';
import type { Item } from '~/core/generic/items';
import type { Research } from '~/core/generic/research';
import { genericShips, type GenericShip, type ShipType } from '~/core/generic/ships';
import { Level, type LevelJSON } from '~/core/level';
import { config, versions } from '~/core/metadata';
import { load } from '../client';
import * as locales from '../locales';
import * as saves from '../saves';
import type { ServerData } from '../servers';
import { connect, remove as removeServer } from '../servers';
import { action } from '../user';
import { download, logger } from '../utils';
import { alert, confirm } from './dialog';

export function instaniateTemplate(selector: string): JQuery<DocumentFragment> {
	return $($<HTMLTemplateElement>(selector)[0].content.cloneNode(true) as DocumentFragment);
}

export function createItemUI(item: Item): JQuery<DocumentFragment> {
	const instance = instaniateTemplate('#item');
	instance.find('.name').text(locales.text('item.name', item.id) + (item.rare ? ' (rare)' : '') + ': ');
	instance.find('.ui-item').on('click', () => action('create_item', item));
	$('div.inventory').append(instance);
	return instance;
}

export function createResearchUI(research: Research): JQuery<DocumentFragment> {
	const instance = instaniateTemplate('#research');
	instance.find('.name').text(locales.text('tech.name', research.id));
	instance.find('.upgrade').on('click', () => action('research', research));
	$('div.lab').append(instance);
	return instance;
}

export function createShipUI(ship: GenericShip): JQuery<DocumentFragment> {
	const instance = instaniateTemplate('#ship');
	instance.find('.name').text(locales.text('entity.name', ship.id));
	instance.find('.add').on('click', () => alert('Disabled.'));
	$('div.shipyard').append(instance);
	return instance;
}

export function createShipyardUI(shipyard: Shipyard): JQuery<DocumentFragment> {
	const instance = instaniateTemplate('#shipyard');
	instance.find('.add').on('click', () => action('create_ship', { ship: genericShips.get(instance.find('select').val() as ShipType)!, shipyard }));
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

export function createSaveListItem(save: LevelJSON): JQuery<HTMLLIElement> {
	const instance = instaniateTemplate('#save').find('li');

	const loadAndPlay = async () => {
		$('#loading_cover').show();
		try {
			logger.info('Loading level from save ' + save.id);

			const replaceGuest = await saves.replaceGuest(save);
			logger.debug('Replacing guest: ' + (replaceGuest ? 'Yes' : 'No'));
			if (!replaceGuest) {
				$('#loading_cover,#hud,canvas.game').hide();
				$('#saves').show();
			}
			const level = Level.FromJSON(save);
			await level.ready();
			load(level);
			$('#loading_cover').hide();
		} catch (e) {
			logger.error(e instanceof Error ? e : e + '');
			const loadAnyway = await confirm('Failed to load save: ' + e + '\nLoad the save anyway?');
			if (config.debug && loadAnyway) {
				$('#loading_cover').hide();
				throw e;
			}
			if (!loadAnyway) {
				await alert('Failed to load save: ' + e);
			}
			$('#loading_cover,#hud,canvas.game').hide();
			$('#saves').show();
		}
	};

	instance
		.on('click', () => {
			$('.selected').removeClass('selected');
			instance.addClass('selected');
		})
		.on('dblclick', loadAndPlay);

	instance.find('.delete').on('click', async e => {
		if (e.shiftKey || (await confirm('Are you sure?'))) {
			saves.remove(save.id);
			instance.remove();
		}
	});

	instance.find('.download').on('click', () => download(JSON.stringify(save), (save.name || 'save') + '.json'));
	instance.find('.play').on('click', loadAndPlay);
	instance.find('.edit').on('click', () => {
		$('#save-edit').find('.id').val(save.id);
		$('#save-edit').find('.name').val(save.name);
		$<HTMLDialogElement>('#save-edit')[0].showModal();
	});
	instance.find('.name').text(save.name);
	instance.find('.version').text(versions.get(save.version)?.text || save.version);
	instance.find('.date').text(new Date(save.date).toLocaleString());

	instance.prependTo('#saves ul');
	return instance;
}

export function createServerListItem(server: ServerData): JQuery<HTMLLIElement> {
	const instance = instaniateTemplate('#server').find('li');
	instance
		.attr('id', server.id)
		.on('click', () => {
			$('.selected').removeClass('selected');
			instance.addClass('selected');
		})
		.on('dblclick', () => connect(server.id))
		.prependTo('#servers ul');
	instance.find('.name').text(server.name);

	instance.find('.delete').on('click', async e => {
		if (e.shiftKey || (await confirm('Are you sure?'))) {
			removeServer(server.id);
			instance.remove();
		}
	});
	instance.find('.play').on('click', () => connect(server.id));
	instance.find('.edit').on('click', () => {
		$('#server-dialog').find('.name').val(server.name);
		$('#server-dialog').find('.url').val(server.url);
		$<HTMLDialogElement>('#server-dialog')[0].showModal();
	});

	return instance;
}
