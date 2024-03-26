import $ from 'jquery';
import type { SerializedEntity } from '../core/entities/Entity';
import type { PlanetBiome } from '../core/generic/planets';
import { Logger } from 'logzen';
const { fileURLToPath } = $app.require('node:url');
const path = $app.require('node:path');

export const upload = (type, multiple = false) =>
		new Promise(res =>
			$<HTMLInputElement>(`<input type=file ${type ? `accept='${type}'` : ''} ${multiple ? 'multiple' : ''}>`)
				.on('change', e => res(Array.from(e.target.files)[0]))
				.trigger('click')
		),
	download = (data: BlobPart, name: string) => $(`<a href=${URL.createObjectURL(new Blob([data]))} download="${name ?? 'download'}"></a>`)[0].click();

export const minimize = Intl.NumberFormat('en', { notation: 'compact' }).format;

export function fixPaths(text: string): string {
	return text.replaceAll(/file:\/\/\/[A-Za-z0-9+&@#/%?=~_|!:,.;-]*[-A-Za-z0-9+&@#/%=~_|]/g, match =>
		fileURLToPath(match)
			.replace(path.resolve(fileURLToPath(import.meta.url), '..', '..', '..'), '')
			.replaceAll('\\', '/')
	);
}

/* eslint-disable no-redeclare */
export const alert = (text: string) =>
	new Promise(resolve => {
		$('#alert .message').html(text.replaceAll('\n', '<br>'));
		$('#alert .ok').on('click', () => {
			$<HTMLDialogElement>('#alert')[0].close();
			resolve(true);
		});
		$<HTMLDialogElement>('#alert')[0].showModal();
	});
export const confirm = (text: string) =>
	new Promise(resolve => {
		$('#confirm .message').html(text.replaceAll('\n', '<br>'));
		$('#confirm .ok').on('click', () => {
			$<HTMLDialogElement>('#confirm')[0].close();
			resolve(true);
		});
		$('#confirm .cancel').on('click', () => {
			$<HTMLDialogElement>('#confirm')[0].close();
			resolve(false);
		});
		$<HTMLDialogElement>('#confirm')[0].showModal();
	});

export function getByString(object: object, path: string, seperator = /[.[\]'"]/) {
	return path
		.split(seperator)
		.filter(p => p)
		.reduce((o, p) => (o ? o[p] : null), object);
}

export function setByString(object: object, path: string, value, seperator = /[.[\]'"]/) {
	return path
		.split(seperator)
		.filter(p => p)
		.reduce((o, p, i) => (o[p] = path.split(seperator).filter(p => p).length === ++i ? value : o[p] || {}), object);
}

export const cookies: Map<string, string> & { get _map(): Map<string, string> } = {
	clear() {
		for (const key of this.keys()) {
			this.delete(key);
		}
	},
	delete(key: string): boolean {
		document.cookie = key + '= ; expires = Thu, 01 Jan 1970 00:00:00 GMT';
		return true;
	},
	get(key: string) {
		return this._map.get(key);
	},
	has(key: string) {
		return this._map.has(key);
	},
	set(key: string, value: string) {
		document.cookie = `${key}=${value}`;
		return this;
	},

	get size() {
		return this._map.size;
	},

	get [Symbol.iterator]() {
		return this._map[Symbol.iterator].bind(this);
	},

	get [Symbol.toStringTag]() {
		return '[object CookieMap]';
	},

	get keys() {
		return this._map.keys.bind(this);
	},

	get values() {
		return this._map.values.bind(this);
	},

	get entries() {
		return this._map.entries.bind(this);
	},

	get forEach() {
		return this._map.forEach.bind(this);
	},

	get _map(): Map<string, string> {
		return new Map(document.cookie.split(';').map((cookie: string) => cookie.split('=', 2)) as [string, string][]);
	},
};

export function getEntityIcon(entity: SerializedEntity): string {
	switch (entity.nodeType) {
		case 'Planet':
			return 'earth-americas';
		case 'Star':
			return 'sun-bright';
		case 'Ship':
			return 'triangle';
		default:
			return 'planet-ringed';
	}
}

export function biomeColor(biome: PlanetBiome): string {
	switch (biome) {
		case 'earthlike':
		case 'jungle':
			return '#cdb';
		case 'islands':
			return '#cde';
		case 'volcanic':
			return '#dbb';
		case 'desert':
			return '#dcb';
		case 'ice':
			return '#cee';
		case 'moon':
			return '#bbb';
	}
}

export function $svg<TElement extends SVGElement>(tag: string): JQuery<TElement> {
	const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
	return $<TElement>(<TElement>element);
}

export const logger = new Logger({ prefix: 'client' });
logger.on('send', $app.log);
