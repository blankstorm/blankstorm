import $ from 'jquery';
import { io } from 'socket.io-client';
import { chat, setPaused, setCurrent } from './index';
import { cookies } from './utils';
import * as listeners from './listeners';
import * as renderer from '../renderer/index';
import { LevelEvent } from '../core/events';
import { Level } from '../core/Level';
import fs from './fs';
import { JSONFileMap } from '../core/utils';
import ServerListItem from './ui/server-list-item';
import { config, versions } from '../core/meta';

import type { Socket } from 'socket.io-client';
import type { ServerPingInfo } from '../server/Server';
import type { JSONValue } from '../core/utils';
import type { Waypoint } from './waypoint';

export class ServerMap extends Map<string, Server> {
	private _map: JSONFileMap;
	selected?: string;
	constructor(path: string) {
		super();
		this._map = new JSONFileMap(path, fs);
		for (const [id, data] of this._map._map) {
			if (!super.has(id)) {
				Server.FromJSON(data as SerializedServer, this);
			}
		}
	}

	get(id: string): Server {
		return super.get(id);
	}

	set(id: string, server: Server): this {
		this._map.set(id, server.toJSON());
		return super.set(id, server);
	}

	delete(id: string): boolean {
		this._map.delete(id);
		return super.delete(id);
	}
}

export type SerializedServer = JSONValue & {
	id: string;
	url: string;
	name: string;
};

export class ServerLevel extends Level {
	waypoints: Waypoint[];
}

export class Server {
	level = new ServerLevel('server_level', true);
	kickMessage: string;
	socket: Socket;
	gui: JQuery<ServerListItem>;
	store: ServerMap;
	pingInfo?: ServerPingInfo;
	_url: string;
	_name: string;

	constructor(url: string, name: string, store: ServerMap) {
		this._url = url;
		this._name = name;
		this.gui = $(new ServerListItem(this));
		this.store = store;
		this.level.waypoints = [];

		this.socket = io(this.url.href, { reconnection: false, autoConnect: false, auth: { token: cookies.get('token'), session: cookies.get('session') } });
		this.socket.on('connect', () => {
			$('#connect').hide();
			$('canvas.game').show().focus();
			$('#hud').show();
			$('#tablist p.info').html(`${this.url.hostname}<br>${versions.get(this.pingInfo.version).text}<br>${this.pingInfo.message}<br>`);
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
			const message =
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
			this.socket.disconnect();
		}
		this.store.selected = null;
		for (const server of this.store.values()) {
			server.ping();
		}
	}

	async ping() {
		const info = this.gui.find('.info');
		info.find('span').html('<svg><use href=images/icons.svg#arrows-rotate /></svg>').css('animation', '2s linear infinite rotate');
		const beforeTime = performance.now();
		try {
			const res = await fetch(`${this.url.origin}/ping`);
			try {
				this.pingInfo = await res.json();
				info.find('span').text(`${((performance.now() - beforeTime) / 2).toFixed()}ms ${this.pingInfo.current_clients}/${this.pingInfo.max_clients}`);
				info.find('tool-tip').html(`${this.url.hostname}<br><br>${versions.get(this.pingInfo.version).text || this.pingInfo.version}<br><br>${this.pingInfo.message}`);
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

	toJSON(): SerializedServer {
		return {
			id: Server.GetID(this.url),
			url: this._url,
			name: this.name,
		};
	}

	static ParseURL(url: string | URL): URL {
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

	static GetID(rawUrl: string | URL): string {
		const url = this.ParseURL(rawUrl);
		return `${url.protocol.slice(0, -1)}_${url.hostname}_${url.port}`;
	}

	static FromJSON(data: SerializedServer, store: ServerMap): Server {
		return new Server(data.url, data.name, store);
	}
}
