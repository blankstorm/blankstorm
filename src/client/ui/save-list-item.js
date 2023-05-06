import $ from 'jquery';
import { confirm, download } from '../utils.js';
import { versions } from '../../core/meta.js';

export default class SaveListItem extends HTMLLIElement {
	constructor(save) {
		super();

		const loadAndPlay = async () => {
			$('#loading_cover').show();
			let live = save.load();
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
			.dblclick(loadAndPlay)
			.prependTo('#save-list');
		$(`<p class="delete" style="position:absolute;left:10%"><svg><use href=images/icons.svg#trash /></svg></p>`).appendTo(this);
		$(`<p class="download" style="position:absolute;left:15%"><svg><use href=images/icons.svg#download /></svg></p>`).appendTo(this);
		$(`<p class="play" style="position:absolute;left:20%"><svg><use href=images/icons.svg#play /></svg></p>`).appendTo(this);
		$(`<p class="edit" style="position:absolute;left:25%"><svg><use href=images/icons.svg#pencil /></svg></p>`).appendTo(this);
		$(`<p class="name" style="position:absolute;left:30%">${save.data.name}</p>`).appendTo(this);
		$(`<p class="version" style="position:absolute;left:55%">${versions.get(save.data.version) ? versions.get(save.data.version).text : save.data.version}</p>`).appendTo(this);
		$(`<p class="date" style="position:absolute;left:65%">${new Date(save.data.date).toLocaleString()}</p>`).appendTo(this);
		$('<p> </p>').appendTo(this);

		$(this)
			.find('.delete')
			.on('click', async e => {
				if (e.shiftKey || (await confirm('Are you sure?'))) {
					save.remove();
				}
			});
		$(this)
			.find('.download')
			.on('click', () => download(JSON.stringify(save.data), (save.data.name || 'save') + '.json'));
		$(this).find('.play').click(loadAndPlay);
		$(this)
			.find('.edit')
			.on('click', () => {
				$('#save-edit').find('.id').val(save.id);
				$('#save-edit').find('.name').val(save.name);
				$('#save-edit')[0].showModal();
			});
	}
}
customElements.define('save-list-item', SaveListItem, { extends: 'li' });
