import $ from 'jquery';
import { confirm, download } from '../utils';
import { versions } from '../../core/meta';
import type { Save } from '../Save';

export default class SaveListItem extends HTMLLIElement {
	constructor(save) {
		super();

		const loadAndPlay = async () => {
			$('#loading_cover').show();
			const live = save.load();
			await live.ready();
			save.store.current = live;
			live.play(save.store);
			$('#loading_cover').hide();
		};

		$(this)
			.css({ 'align-items': 'center', height: '3em', 'word-wrap': 'break-word', overflow: 'none' })
			.attr('bg', '')
			.attr('clickable', '')
			.on('click', () => {
				$('.selected').removeClass('selected');
				save.store.selected = save.data.id;
				$(this).addClass('selected');
			})
			.on('dblclick', loadAndPlay)
			.prependTo('#save-list');
		$(`<p class="delete" style="position:absolute;left:10%"><svg><use href=images/icons.svg#trash /></svg></p>`)
			.on('click', async e => {
				if (e.shiftKey || (await confirm('Are you sure?'))) {
					save.remove();
				}
			})
			.appendTo(this);
		$(`<p class="download" style="position:absolute;left:15%"><svg><use href=images/icons.svg#download /></svg></p>`)
			.on('click', () => download(JSON.stringify(save.data), (save.data.name || 'save') + '.json'))
			.appendTo(this);
		$(`<p class="play" style="position:absolute;left:20%"><svg><use href=images/icons.svg#play /></svg></p>`).on('click', loadAndPlay).appendTo(this);
		$(`<p class="edit" style="position:absolute;left:25%"><svg><use href=images/icons.svg#pencil /></svg></p>`)
			.on('click', () => {
				$('#save-edit').find('.id').val(save.id);
				$('#save-edit').find('.name').val(save.name);
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
customElements.define('save-list-item', SaveListItem, { extends: 'li' });
