import 'jquery'; /* global $ */
import 'socket.io-client'; /* global io */

import { modal, alert, confirm } from './utils.js';
import { isJSON } from 'core';
import { Playable } from './playable.js';
import { servers, cookie, canvas, chat, player, setPaused, setCurrent } from './index.js';
import { update as updateUI } from './ui.js';
import * as listeners from './listeners.js';
import * as renderer from './renderer/index.js';
import { LevelEvent } from '../core/events.js';
import Level from '../core/Level.js';
import fs from './fs.js';

export default class Server extends Playable {
	static async Dialog(server) {
		const result = await modal(
			[
				{ name: 'name', placeholder: 'Display name', value: server instanceof Server ? server.name : null },
				{ name: 'url', placeholder: 'Server URL or IP Address', value: server instanceof Server ? server.url : null },
			],
			{ Cancel: false, Save: true }
		);
		if (result.result) {
			if (!fs.existsSync('servers')) {
				fs.mkdirSync('servers');
			}
			if (server instanceof Server) {
				fs.serverStore.put(result.name, result.url);
				server.name = result.name;
				if (server.url != result.url) {
					serverStore.delete(server.url);
					server.url = result.url;
				}
			} else {
				if (servers.has(result.url)) {
					alert('A server with that URL already exists.');
				} else {
					new Server(result.url, result.name, player.data());
				}
			}
			updateUI();
		}
	}
	level = new Level('server_level', true);
	constructor(url, name) {
		super(url, servers);

		Object.assign(this, {
			url,
			name,
			kickMessage: null,
			socket: null,
			gui: $(`<li ofn bg style=align-items:center;height:3em></li>`),
		});
		this.level.waypoints = [];
		db.tx('servers', 'readwrite').then(tx => tx.objectStore('servers').put(name, url));
		this.socket = io(this.url, { reconnection: false, autoConnect: false, auth: { token: cookie.token, session: cookie.session } });
		this.socket.on('connect', () => {
			$('#connect').hide();
			canvas.show();
			canvas.focus();
			$('#hud').show();
			$('#tablist p.info').html(`${this.url}<br>${this.pingData.version.text}<br>${this.pingData.message}<br>`);
			renderer.clear();
			renderer.engine.resize();
			setPaused(false);
		});
		this.socket.on('connect_error', err => {
			$('#connect p').text('Connection refused: ' + err.message);
			$('#connect button').text('Back');
		});
		this.socket.on('connect_failed', err => {
			$('#connect p').text('Connection failed: ' + err.message);
			$('#connect button').text('Back');
		});
		this.socket.on('playerlist', list => {
			$('#tablist p.players').html(list.join('<br>'));
		});
		this.socket.on('kick', message => {
			this.kickMessage = 'Kicked from server: ' + message;
		});
		this.socket.on('chat', message => {
			chat(message);
		});
		this.socket.on('event', (type, emitter, data) => {
			if (type == 'level.tick') {
				Level.FromData(emitter, this.level);
				setCurrent(this.level);
				this.level.sampleTick();
			}
			if (!listeners.core.has(type)) {
				console.warn(new Error(`Recieved invalid packet type "${type}"`));
			} else {
				const evt = new LevelEvent(type, emitter, data);
				listeners.core.get(type)(evt);
			}
		});
		this.socket.on('disconnect', reason => {
			let message =
				this.kickMessage ??
				(reason == 'io server disconnect'
					? 'Disconnected by server'
					: reason == 'io client disconnect'
					? 'Client disconnected'
					: reason == 'ping timeout' || reason == 'transport error'
					? 'Connection timed out'
					: reason == 'transport close'
					? 'Lost Connection'
					: reason);
			$('#connect p').text(message);
			this.kickMessage = null;
			$('#connect button').text('Back');
			$('[ingame]').hide();
			$(reason == 'io client disconnect' ? '#load' : '#connect').show();
		});
		this.gui.delete = $(`<p style=position:absolute;left:15%><svg><use href=images/icons.svg#trash /></svg></p>`).appendTo(this.gui);
		this.gui.play = $(`<p style=position:absolute;left:20%><svg><use href=images/icons.svg#play /></svg></p>`).appendTo(this.gui);
		this.gui.edit = $(`<p style=position:absolute;left:25%><svg><use href=images/icons.svg#pencil /></svg></p>`).appendTo(this.gui);
		this.gui.name = $(`<p style=position:absolute;left:30%>${this.name}</p>`).appendTo(this.gui);
		this.gui.info = $(`<p style=position:absolute;left:75%><tool-tip></tool-tip></p>`).appendTo(this.gui);
		$('<p> </p>').appendTo(this.gui);
		this.gui
			.attr('clickable', true)
			.click(() => {
				$('.selected').removeClass('selected');
				this.gui.addClass('selected');
				this.getStore().selected = this.url;
			})
			.dblclick(() => this.connect())
			.prependTo('#load');
		this.gui.delete.click(() => {
			confirm().then(async () => {
				this.gui.remove();
				this.getStore().delete(this.url);
				if (!fs.existsSync('servers')) {
					fs.mkdirSync('servers');
				}
				fs.rmSync(this.path);
			});
		});
		this.gui.play.click(() => this.connect());
		this.gui.edit.click(() => Server.Dialog(this));
		this.getStore().set(this.url, this);
	}
	connect() {
		if (this?.socket?.connected) {
			throw new ReferenceError(`Can't connect to server: already connected`);
		}
		$('#load').hide();
		$('#connect').show();
		$('#connect p').text('Connecting...');
		$('#connect button').text('Back');
		this.socket.connect();
	}
	disconnect() {
		if (this.socket.connected) {
			this.socket.disconnect(true);
		}
		this.getStore().selected = null;
		[...this.getStore().values()].forEach(server => server.ping());
	}
	ping() {
		this.gui.info.html('<svg><use href=images/icons.svg#arrows-rotate /></svg>').css('animation', '2s linear infinite rotate');
		let beforeTime = performance.now();
		let url = /.+:(\d){1,5}/.test(this.url) ? this.url : this.url + ':1123';
		$.get(`${/http(s?):\/\//.test(url) ? url : 'https://' + url}/ping`)
			.done(data => {
				if (isJSON(data)) {
					this.pingData = JSON.parse(data);
					this.gui.info
						.text(`${((performance.now() - beforeTime) / 2).toFixed()}ms ${this.pingData.current_clients}/${this.pingData.max_clients}`)
						.find('tool-tip')
						.html(`${this.url}<br><br>${this.pingData.version.text}<br><br>${this.pingData.message}`);
				} else {
					this.gui.info.html('<svg><use href=images/icons.svg#xmark /></svg>').find('tool-tip').html('Invalid response');
				}
			})
			.fail(() => {
				this.gui.info.html('<svg><use href=images/icons.svg#xmark /></svg>').find('tool-tip').html(`Can't connect to server`);
			})
			.always(() => {
				this.gui.info.css('animation', 'unset');
			});
	}

	get path() {
		return `servers/${this.id}.json`;
	}

	saveToStorage() {
		if (!fs.existsSync('servers')) {
			fs.mkdirSync('servers');
		}

		fs.writeFileSync(this.path, JSON.stringify({
			url: this.url,
			name: this.name,
		}), { encoding: 'utf-8' });
	}
}
