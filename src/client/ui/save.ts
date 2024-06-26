import $ from 'jquery';
import { alert, confirm, download, logger } from '../utils';
import { versions } from '../../core/metadata';
import type { Save } from '../saves';
import { load } from '../client';

export class SaveListItem extends HTMLLIElement {
	constructor(save: Save) {
		super();

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

		$(this)
			.css({ 'align-items': 'center', height: '3em', 'word-wrap': 'break-word', overflow: 'none' })
			.addClass('bg-normal clickable')
			.on('click', () => {
				$('.selected').removeClass('selected');
				$(this).addClass('selected');
			})
			.on('dblclick', loadAndPlay)
			.prependTo('#save-list');
		$(`<p class="delete" style="position:absolute;left:10%"><svg><use href="assets/images/icons.svg#trash"/></svg></p>`)
			.on('click', async e => {
				if (e.shiftKey || (await confirm('Are you sure?'))) {
					save.remove();
				}
			})
			.appendTo(this);
		$(`<p class="download" style="position:absolute;left:15%"><svg><use href="assets/images/icons.svg#download"/></svg></p>`)
			.on('click', () => download(JSON.stringify(save.data), (save.data.name || 'save') + '.json'))
			.appendTo(this);
		$(`<p class="play" style="position:absolute;left:20%"><svg><use href="assets/images/icons.svg#play"/></svg></p>`).on('click', loadAndPlay).appendTo(this);
		$(`<p class="edit" style="position:absolute;left:25%"><svg><use href="assets/images/icons.svg#pencil"/></svg></p>`)
			.on('click', () => {
				$('#save-edit').find('.id').val(save.id);
				$('#save-edit').find('.name').val(save.data.name);
				$<HTMLDialogElement>('#save-edit')[0].showModal();
			})
			.appendTo(this);
		$(`
			<p class="name" style="position:absolute;left:30%">${save.data.name}</p>
			<p class="version" style="position:absolute;left:55%">${versions.get(save.data.version)?.text || save.data.version}</p>
			<p class="date" style="position:absolute;left:65%">${new Date(save.data.date).toLocaleString()}</p>
			<p> </p>
		`).appendTo(this);
	}
}
customElements.define('ui-save', SaveListItem, { extends: 'li' });
