import $ from 'jquery';
import type { Item } from '../../core/generic/items';
import type { Research } from '../../core/generic/research';
import { genericShips, shipTypes, type GenericShip, type ShipType } from '../../core/generic/ships';
import { versions } from '../../core/metadata';
import type { Berth } from '../../core/stations/berth';
import { load } from '../client';
import * as locales from '../locales';
import type { Save } from '../saves';
import type { ServerData } from '../servers';
import { connect, remove as removeServer } from '../servers';
import { action } from '../user';
import { confirm, download, logger } from '../utils';

function instaniateTemplate(selector: string): JQuery<DocumentFragment> {
	return $($<HTMLTemplateElement>(selector)[0].content.cloneNode(true) as DocumentFragment);
}

export function createScreenshotUI(src: string): JQuery<DocumentFragment> {
	const instance = instaniateTemplate('#screenshot');
	const contextMenu = instaniateTemplate('#screenshot-context-menu').find('div');

	instance.find('img').attr('src', src);

	instance.on('contextmenu', e => {
		e.preventDefault();
		contextMenu.css({ left: e.pageX, top: e.pageY });
		instance.parent().append(contextMenu);
		const height = parseFloat(getComputedStyle(contextMenu[0]).height);
		contextMenu.css('top', e.pageY + height < innerHeight ? e.pageY : e.pageY - height);
	});

	contextMenu.find('button.download').on('click', () => {
		$('<a download=screenshot.png></a>').attr('href', src)[0].click();
	});
	contextMenu.find('button.delete').on('click', () => {
		confirm('Are you sure?').then(() => {
			instance.remove();
		});
	});

	$('#ingame-temp-menu div.screenshots').append(instance);
	return instance;
}

export function createItemUI(item: Item): JQuery<DocumentFragment> {
	const instance = instaniateTemplate('#item');
	instance.find('.name').text(locales.text(`item.${item.id}.name`) + (item.rare ? ' (rare)' : '') + ': ');
	instance.find('.ui-item').on('click', () => action('create_item', item));
	$('div.inventory').append(instance);
	return instance;
}

export function createResearchUI(research: Research): JQuery<DocumentFragment> {
	const instance = instaniateTemplate('#research');
	instance.find('.name').text(locales.text(`tech.${research.id}.name`));
	instance.find('.upgrade').on('click', () => action('research', research));
	const $lab = $('div.lab');
	console.log($lab[0]);
	$lab.append(instance);
	return instance;
}

export function createShipUI(ship: GenericShip): JQuery<DocumentFragment> {
	const instance = instaniateTemplate('#ship');
	instance.find('.name').text(locales.text(`entity.${ship.id}.name`));
	instance.find('.add').on('click', () => action('create_ship', ship));
	$('div.shipyard').append(instance);
	return instance;
}

export function createBerthUI(berth: Berth): JQuery<DocumentFragment> {
	const instance = instaniateTemplate('#berth');
	instance.find('.active').text('Building: ' + locales.text(`entity.${berth.productionID}.name`));
	instance.find('.add').on('click', () => action('create_ship', genericShips[instance.find('select').val() as ShipType], berth));
	instance.find(berth.productionID ? '.non-active' : '.active').hide();
	instance.find(berth.productionID ? '.active' : '.non-active').show();

	for (const type of shipTypes) {
		$('<option></option>')
			.attr('value', type)
			.text(locales.text(`entity.${type}.name`))
			.appendTo(instance.find('select'));
	}
	return instance;
}

export function createSaveListItem(save: Save): JQuery<DocumentFragment> {
	const instance = instaniateTemplate('#save');

	const loadAndPlay = async () => {
		$('#loading_cover').show();
		try {
			const live = save.load();
			await live.ready();
			load(live);
			$('#loading_cover').hide();
		} catch (e) {
			alert('Failed to load save: ' + e);
			logger.error(e);
			throw e;
		}
	};

	instance
		.find('li')
		.on('click', () => {
			$('.selected').removeClass('selected');
			instance.addClass('selected');
		})
		.on('dblclick', loadAndPlay);

	instance.find('.delete').on('click', async e => {
		if (e.shiftKey || (await confirm('Are you sure?'))) {
			save.remove();
		}
	});

	instance.find('.download').on('click', () => download(JSON.stringify(save.data), (save.data.name || 'save') + '.json'));
	instance.find('.play').on('click', loadAndPlay);
	instance.find('.edit').on('click', () => {
		$('#save-edit').find('.id').val(save.id);
		$('#save-edit').find('.name').val(save.data.name);
		$<HTMLDialogElement>('#save-edit')[0].showModal();
	});
	instance.find('.name').text(save.data.name);
	instance.find('.version').text(versions.get(save.data.version)?.text || save.data.version);
	instance.find('.date').text(new Date(save.data.date).toLocaleString());

	$('#save-list').prepend(instance);
	return instance;
}

export function createServerUI(server: ServerData) {
	const instance = instaniateTemplate('#server');
	instance
		.attr('id', server.id)
		.on('click', () => {
			$('.selected').removeClass('selected');
			instance.addClass('selected');
		})
		.on('dblclick', () => connect(server.id))
		.prependTo('#server-list');
	instance.find('.name').text(server.name);

	instance.find('.delete').on('click', async e => {
		if (e.shiftKey || (await confirm('Are you sure?'))) {
			removeServer(server.id);
		}
	});
	instance.find('.play').on('click', () => connect(server.id));
	instance.find('.edit').on('click', () => {
		$('#server-dialog').find('.name').val(server.name);
		$('#server-dialog').find('.url').val(server.url);
		$<HTMLDialogElement>('#server-dialog')[0].showModal();
	});
}
