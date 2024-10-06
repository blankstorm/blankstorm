import type EventEmitter from 'eventemitter3';
import $ from 'jquery';
import * as fs from 'node:fs';
import type { Socket } from 'socket.io-client';
import { io } from 'socket.io-client';
import { isJSON, pick } from 'utilium';
import { JSONFileMap } from 'utilium/fs.js';
import { Level, type LevelEvents, type LevelJSON } from '../core/level';
import { config, versions } from '../core/metadata';
import type { PingInfo } from '../server/server';
import { sendMessage } from './chat';
import { currentLevel, load, unload } from './client';
import { path } from './config';
import { createServerListItem } from './ui/templates';
import { logger } from './utils';
import { hasText, text } from './locales';
import { alert } from './ui/dialog';

export type ServerData = {
	id: string;
	url: string;
	name: string;
};

let kickMessage: string | null;

function handleDisconnect(reason: string): void {
	$('#connect p').text(kickMessage ?? (hasText('disconnet_reason', reason) ? text('disconnet_reason', reason) : reason));
	kickMessage = null;
	$('[ingame]').hide();
	$(reason == 'io client disconnect' ? '#servers' : '#connect').show();
}

function handleConnectionError({ message }: Error): void {
	$('#connect p').text(text('connection_refused') + message);
}

function handleConnectionFailed({ message }: Error): void {
	$('#connect p').text(text('connection_failed') + message);
}

function handleEvent<T extends EventEmitter.EventNames<LevelEvents>>(type: T, ...data: EventEmitter.EventArgs<LevelEvents, T>) {
	if (type == 'update') {
		if (!currentLevel) {
			load(new Level());
		}
		currentLevel!.fromJSON(data[0] as LevelJSON);
		currentLevel!.sampleTick();
	}

	currentLevel?.emit(type, ...data);
}

function updatePlayerList(list: string[]): void {
	$('#tablist p.players').html(list.join('<br>'));
}

export const pingCache: Map<string, PingInfo> = new Map();

export let socket: Socket;

export function disconnect(): void {
	if (socket.connected) {
		socket.disconnect();
	}

	for (const id of ids()) {
		void ping(id);
	}
}

export async function ping(id: string): Promise<void> {
	const server: ServerData = get(id);
	const url = parseURL(server.url);
	const info = gui(id).find('.info');
	info.find('span').html('<svg><use href="assets/images/icons.svg#arrows-rotate"/></svg>').find('svg').addClass('server-ping-rotate');
	const beforeTime = performance.now();
	try {
		const res = await fetch(`${url.origin}/ping`);
		try {
			const ping = (await res.json()) as PingInfo;
			pingCache.set(id, ping);
			info.find('span').text(`${((performance.now() - beforeTime) / 2).toFixed()}ms ${ping.current_clients}/${ping.max_clients}`);
			info.find('tool-tip').html(`${url.hostname}<br><br>${versions.get(ping.version)?.text || ping.version}<br><br>${ping.message}`);
		} catch (_) {
			info.find('span').html('<svg><use href="assets/images/icons.svg#xmark"/></svg>');
			info.find('tool-tip').html('Invalid response');
		}
	} catch (_) {
		info.find('span').html('<svg><use href="assets/images/icons.svg#xmark"/></svg>');
		info.find('tool-tip').html(text('server_no_connection'));
	} finally {
		info.find('span svg').removeClass('server-ping-rotate');
	}
}

export async function pingAll(): Promise<void> {
	for (const id of ids()) {
		await ping(id);
	}
}

export function connect(id: string): void {
	if (socket?.connected) {
		logger.error('Attempted to connect to a server while already connected');
		void alert(text('server_already_connected'));
		return;
	}
	unload();
	const server = get(id),
		url = parseURL(server.url),
		pingInfo = pingCache.get(id);
	socket = io(url.href, { reconnection: false, auth: pick(options, 'token', 'session') });
	socket.on('connect', () => {
		$('#tablist p.info').html(`${url.hostname}<br>${(pingInfo?.version ? versions.get(pingInfo.version)?.text : null) || pingInfo?.version}<br>${pingInfo?.message}<br>`);
	});
	socket.on('connect_error', handleConnectionError);
	socket.on('connect_failed', handleConnectionFailed);
	socket.on('playerlist', updatePlayerList);
	socket.on('kick', message => (kickMessage = text('kick_prefix') + message));
	socket.on('chat', sendMessage);
	socket.on('event', handleEvent);
	socket.on('disconnect', handleDisconnect);
	$('#servers').hide();
	$('#connect').show();
	$('#connect p').text(text('connecting'));
}

export function parseURL(url: string | URL): URL {
	if (url instanceof URL) {
		return url;
	}
	if (!/^(http|ws)s?:\/\//.test(url)) {
		url = 'http://' + url;
	}
	if (!/^(http|ws)s?:\/\/[\w.]+:\d+/.test(url)) {
		url += ':' + config.default_port;
	}
	return new URL(url);
}

export function getID(rawUrl: string | URL): string {
	return parseURL(rawUrl).host;
}

export let file: JSONFileMap<ServerData>;

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
	file = new JSONFileMap(filePath, config);

	for (const server of data()) {
		createServerListItem(server);
	}
}

export function add(name: string, url: string): string {
	const id = getID(url);
	file.set(id, { id, name, url });
	createServerListItem({ id, name, url });
	return id;
}

export function gui(id: string): JQuery<HTMLLIElement> {
	return $<HTMLLIElement>('#' + id);
}

export function rename(id: string, name: string): void {
	const data: ServerData = get(id);
	data.name = name;
	file.set(id, data);

	gui(id).find('.name').text(name);
}

export const get = (id: string): ServerData => file.get(id);
export const has = (id: string): boolean => file.has(id);
export const ids = () => file.keys();
export const entries = () => file.entries();
export const data = () => file.values();
export function remove(id: string): boolean {
	gui(id).remove();
	return file.delete(id);
}
