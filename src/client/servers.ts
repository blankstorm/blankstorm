import $ from 'jquery';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import { cookies } from './utils';
const fs = $app.require('fs');
import { JSONFileMap, isJSON } from '../core/utils';
import { ServerListItem } from './ui/server';
import { config, versions } from '../core/metadata';
import type { ServerPingInfo } from '../server/Server';
import type { JSONValue } from '../core/utils';
import { ClientLevel } from './level';
import EventEmitter from 'eventemitter3';
import { logger, path, sendChatMessage } from './client';

export type SerializedServer = JSONValue & {
	id: string;
	url: string;
	name: string;
};

export class Server extends EventEmitter {
	level = new ClientLevel('server_level');
	kickMessage: string;
	socket: Socket;
	gui: JQuery<ServerListItem>;
	pingInfo?: ServerPingInfo;

	constructor(public _url: string, public _name: string) {
		super();
		this.gui = $<ServerListItem>(new ServerListItem(this));
		this.level.isServer = true;
		this.socket = io(this.url.href, { reconnection: false, autoConnect: false, auth: { token: cookies.get('token'), session: cookies.get('session') } });
		this.socket.on('connect', () => {
			$('#tablist p.info').html(`${this.url.hostname}<br>${versions.get(this.pingInfo.version).text}<br>${this.pingInfo.message}<br>`);
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
			sendChatMessage(message);
		});
		this.socket.on('event', (type: string, ...data) => {
			if (type == 'level.tick') {
				ClientLevel.FromJSON(data[0], this.level);
				this.level.sampleTick();
			}

			this.level.emit(type, ...data);
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
		set(this.id, this);
	}

	get id() {
		return getServerID(this._url);
	}

	get name() {
		return this._name;
	}

	set name(val) {
		this.gui.find('.name').text(val);
		this._name = val;
		set(this.id, this);
	}

	get url() {
		return parseServerURL(this._url);
	}

	set url(val) {
		this._url = val instanceof URL ? val.href : val;
		set(this.id, this);
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
		selected = null;
		for (const server of map.values()) {
			server.ping();
		}
	}

	async ping() {
		const info = this.gui.find('.info');
		info.find('span').html('<svg><use href="_build.asset_dir/images/icons.svg#arrows-rotate"/></svg>').find('svg').addClass('server-ping-rotate');
		const beforeTime = performance.now();
		try {
			const res = await fetch(`${this.url.origin}/ping`);
			try {
				this.pingInfo = await res.json();
				info.find('span').text(`${((performance.now() - beforeTime) / 2).toFixed()}ms ${this.pingInfo.current_clients}/${this.pingInfo.max_clients}`);
				info.find('tool-tip').html(`${this.url.hostname}<br><br>${versions.get(this.pingInfo.version).text || this.pingInfo.version}<br><br>${this.pingInfo.message}`);
			} catch (e) {
				info.find('span').html('<svg><use href="_build.asset_dir/images/icons.svg#xmark"/></svg>');
				info.find('tool-tip').html('Invalid response');
			}
		} catch (e) {
			info.find('span').html('<svg><use href="_build.asset_dir/images/icons.svg#xmark"/></svg>');
			info.find('tool-tip').html(`Can't connect to server`);
		} finally {
			info.find('span svg').removeClass('server-ping-rotate');
		}
	}

	toJSON(): SerializedServer {
		return {
			id: getServerID(this.url),
			url: this._url,
			name: this.name,
		};
	}

	remove() {
		this.gui.remove();
	}

	static FromJSON(data: SerializedServer): Server {
		return new Server(data.url, data.name);
	}
}

export function parseServerURL(url: string | URL): URL {
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

export function getServerID(rawUrl: string | URL): string {
	const url = parseServerURL(rawUrl);
	return `${url.protocol.slice(0, -1)}_${url.hostname}_${url.port}`;
}

export let file: JSONFileMap;
export let selected: string;
export function select(id: string): void {
	selected = id;
}
const map: Map<string, Server> = new Map();

export function init() {
	const filePath = path + '/servers.json',
		exists = fs.existsSync(filePath);
	if (!exists) {
		logger.warn('Servers file does not exist, will be created');
	}
	if (exists && !isJSON(fs.readFileSync(filePath, 'utf8'))) {
		logger.warn('Invalid servers file (overwriting)');
		fs.rmSync(filePath);
	}
	file = new JSONFileMap(filePath, fs);
	for (const [id, data] of file._map) {
		if (!map.has(id)) {
			Server.FromJSON(data as SerializedServer);
		}
	}
}

export const get = (id: string): Server => map.get(id);
export const has = (id: string): boolean => map.has(id);
export const ids = () => map.keys();
export const entries = () => map.entries();
export const servers = () => map.values();

export function set(id: string, server: Server): void {
	file.set(id, server.toJSON());
	map.set(id, server);
	return;
}

export function remove(id: string): boolean {
	const fremoved = file.delete(id);
	return map.delete(id) && fremoved;
}

export { remove as delete };
