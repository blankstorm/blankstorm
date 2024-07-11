import $ from 'jquery';
import { alert, confirm, download, logger } from '../utils';
import { versions } from '../../core/metadata';
import type { Save } from '../saves';
import { load } from '../client';
import { instaniateTemplate } from './utils';

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

	const $i = $(instance);

	$i.find('li')
		.on('click', () => {
			$('.selected').removeClass('selected');
			$i.addClass('selected');
		})
		.on('dblclick', loadAndPlay);

	$i.find('.delete').on('click', async e => {
		if (e.shiftKey || (await confirm('Are you sure?'))) {
			save.remove();
		}
	});

	$i.find('.download').on('click', () => download(JSON.stringify(save.data), (save.data.name || 'save') + '.json'));
	$i.find('.play').on('click', loadAndPlay);
	$i.find('.edit').on('click', () => {
		$('#save-edit').find('.id').val(save.id);
		$('#save-edit').find('.name').val(save.data.name);
		$<HTMLDialogElement>('#save-edit')[0].showModal();
	});
	$i.find('.name').text(save.data.name);
	$i.find('.version').text(versions.get(save.data.version)?.text || save.data.version);
	$i.find('.date').text(new Date(save.data.date).toLocaleString());

	$('#save-list').prepend(instance);
	return $i;
}
