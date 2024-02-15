import $ from 'jquery';
import { confirm } from '../utils';
import { select, type Server } from '../servers';
import { startPlaying } from '../client';

function connectAndStartPlaying(server: Server) {
	server.connect();
	startPlaying(server.level);
}

export class ServerListItem extends HTMLLIElement {
	constructor(server: Server) {
		super();
		$(this)
			.css({
				overflow: 'none',
				'align-items': 'center',
				height: '3em',
			})
			.addClass('bg-normal clickable')
			.on('click', () => {
				$('.selected').removeClass('selected');
				$(this).addClass('selected');
				select(server.id);
			})
			.on('dblclick', () => connectAndStartPlaying(server))
			.prependTo('#server-list');
		$(`<p class="delete" style=position:absolute;left:15%><svg><use href="_build.asset_dir/images/icons.svg#trash"/></svg></p>`).appendTo(this);
		$(`<p class="play" style=position:absolute;left:20%><svg><use href="_build.asset_dir/images/icons.svg#play"/></svg></p>`).appendTo(this);
		$(`<p class="edit" style=position:absolute;left:25%><svg><use href="_build.asset_dir/images/icons.svg#pencil"/></svg></p>`).appendTo(this);
		$(`<p class="name" style=position:absolute;left:30%>${server.name}</p>`).appendTo(this);
		$(`<p class="info" style=position:absolute;left:75%><span></span><tool-tip></tool-tip></p>`).appendTo(this);
		$(this)
			.find('.delete')
			.on('click', async e => {
				if (e.shiftKey || (await confirm('Are you sure?'))) {
					server.remove();
				}
			});
		$(this)
			.find('.play')
			.on('click', () => connectAndStartPlaying(server));
		$(this)
			.find('.edit')
			.on('click', () => {
				$('#server-dialog').find('.name').val(server.name);
				$('#server-dialog').find('.url').val(server._url);
				$<HTMLDialogElement>('#server-dialog')[0].showModal();
			});
	}
}
customElements.define('ui-server', ServerListItem, { extends: 'li' });
