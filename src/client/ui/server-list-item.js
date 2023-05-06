import $ from 'jquery';
import { confirm } from '../utils.js';

export default class ServerListItem extends HTMLLIElement {
	constructor(server) {
		super();
		$(this)
			.css({
				overflow: 'none',
				'align-items': 'center',
				height: '3em',
			})
			.attr('bg', '')
			.attr('clickable', true)
			.on('click', () => {
				$('.selected').removeClass('selected');
				$(this).addClass('selected');
				server.store.selected = server.id;
			})
			.on('dblclick', () => this.connect())
			.prependTo('#server-list');
		$(`<p class="delete" style=position:absolute;left:15%><svg><use href=images/icons.svg#trash /></svg></p>`).appendTo(this);
		$(`<p class="play" style=position:absolute;left:20%><svg><use href=images/icons.svg#play /></svg></p>`).appendTo(this);
		$(`<p class="edit" style=position:absolute;left:25%><svg><use href=images/icons.svg#pencil /></svg></p>`).appendTo(this);
		$(`<p class="name" style=position:absolute;left:30%>${server.name}</p>`).appendTo(this);
		$(`<p class="info" style=position:absolute;left:75%><span></span><tool-tip></tool-tip></p>`).appendTo(this);
		$(this)
			.find('.delete')
			.on('click', async e => {
				if (e.shiftKey || (await confirm('Are you sure?'))) {
					$(this).remove();
					server.remove();
				}
			});
		$(this)
			.find('.play')
			.on('click', () => server.connect());
		$(this)
			.find('.edit')
			.on('click', () => {
				$('#server-dialog').find('.name').val(server.name);
				$('#server-dialog').find('.url').val(server._url);
				$('#server-dialog')[0].showModal();
			});
	}
}
customElements.define('server-list-item', ServerListItem, { extends: 'li' });
