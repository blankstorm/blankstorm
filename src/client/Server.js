import $ from 'jquery';
import { io } from 'socket.io-client';

import { cookie, chat, setPaused, setCurrent } from './index.js';
import * as listeners from './listeners.js';
import * as renderer from './renderer/index.js';
import { LevelEvent } from '../core/events.js';
import Level from '../core/Level.js';
import fs from './fs.js';
import { JSONFileMap } from '../core/utils.js';
import ServerListItem from './ui/server-list-item.js';
import { config, versions } from '../core/meta.js';

export class ServerMap extends JSONFileMap {
	_live = new Map();
	constructor(path) {
		super(path, fs);

		for (const [id, data] of super._getMap()) {
			if (!this._live.has(id)) {
				Server.FromJSON(data, this);
			}
		}
	}

	_getMap() {
		return this._live;
	}

	get(id) {
		return this._live.get(id);
	}

	set(id, server) {
		super.set(id, server.toJSON());
		this._live.set(id, server);
	}

	delete(id) {
		this._live.delete(id);
		super.delete(id);
	}
}

export class Server {
	level = new Level('server_level', true);
	kickMessage = null;
	socket = null;

	constructor(url, name, store) {
		this._url = url;
		this._name = name;
		this.gui = $(new ServerListItem(this));
		this.store = store;
		this.level.waypoints = [];

		this.socket = io(this.url.href, { reconnection: false, autoConnect: false, auth: { token: cookie.token, session: cookie.session } });
		this.socket.on('connect', () => {
			$('#connect').hide();
			$('canvas.game').show().focus();
			$('#hud').show();
			$('#tablist p.info').html(`${this.url.hostname}<br>${this.pingData.version.text}<br>${this.pingData.message}<br>`);
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
			if (!listeners.core[type]) {
				console.warn(new Error(`Recieved invalid packet type "${type}"`));
			} else {
				const evt = new LevelEvent(type, emitter, data);
				listeners.core[type](evt);
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
			$(reason == 'io client disconnect' ? '#server-list' : '#connect').show();
		});
		this.store.set(this.id, this);
	}

	get id() {
		return Server.GetID(this._url);
	}

	get name() {
		return this._name;
	}

	set name(val) {
		this.gui.find('.name').text(val);
		this._name = val;
		this.store.set(this.id, this);
	}

	get url() {
		return Server.ParseURL(this._url);
	}

	set url(val) {
		this._url = val instanceof URL ? val.href : val;
		this.store.set(this.id, this);
	}

	connect() {
		if (this?.socket?.connected) {
			throw new ReferenceError(`Can't connect to server: already connected`);
		}
		$('#server-list').hide();
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

	async ping() {
		const info = this.gui.find('.info');
		info.find('span').html('<svg><use href=images/icons.svg#arrows-rotate /></svg>').css('animation', '2s linear infinite rotate');
		let beforeTime = performance.now();
		try {
			const res = await fetch(`${this.url.origin}/ping`);
			try {
				this.pingData = await res.json();
				info.find('span').text(`${((performance.now() - beforeTime) / 2).toFixed()}ms ${this.pingData.current_clients}/${this.pingData.max_clients}`);
				info.find('tool-tip').html(`${this.url.hostname}<br><br>${versions.get(this.pingData.version).text || this.pingData.version}<br><br>${this.pingData.message}`);
			} catch (e) {
				info.find('span').html('<svg><use href=images/icons.svg#xmark /></svg>');
				info.find('tool-tip').html('Invalid response');
			}
		} catch (e) {
			info.find('span').html('<svg><use href=images/icons.svg#xmark /></svg>');
			info.find('tool-tip').html(`Can't connect to server`);
		} finally {
			info.find('span').css('animation', 'unset');
		}
	}

	toJSON() {
		return {
			id: Server.GetID(this.url),
			url: this._url,
			name: this.name,
		};
	}

	static ParseURL(url) {
		if (url instanceof URL) {
			return url;
		}
		if (!/^(http|ws)s?:\/\//.test(url)) {
			url = location.protocol + '//' + url;
		}
		if (!/^(http|ws)s?:\/\/[\w.]+:\d+/.test(url)) {
			url += ':' + config.default_port;
		}
		return new URL(url);
	}

	static GetID(rawUrl) {
		const url = this.ParseURL(rawUrl);
		return `${url.protocol.slice(0, -1)}_${url.hostname}_${url.port}`;
	}

	static FromJSON(data, store) {
		return new Server(data.url, data.name, store);
	}
}
