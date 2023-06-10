import $ from 'jquery';
import type { SerializedNode } from '../core/nodes/Node';
import type { PlanetBiome } from '../core/generic/planets';

export const upload = (type, multiple = false) =>
		new Promise(res =>
			$<HTMLInputElement>(`<input type=file ${type ? `accept='${type}'` : ''} ${multiple ? 'multiple' : ''}>`)
				.on('change', e => res(Array.from(e.target.files)[0]))
				.trigger('click')
		),
	download = (data: BlobPart, name: string) => $(`<a href=${URL.createObjectURL(new Blob([data]))} download="${name ?? 'download'}"></a>`)[0].click();

export const minimize = Intl.NumberFormat('en', { notation: 'compact' }).format;

type _jquery_text_parameter = string | number | boolean | ((this: HTMLElement, index: number, text: string) => string | number | boolean);
/* eslint-disable no-redeclare */
export const alert = (text: _jquery_text_parameter) =>
	new Promise(resolve => {
		$('#alert .message').text(text);
		$('#alert .ok').on('click', () => {
			$<HTMLDialogElement>('#alert')[0].close();
			resolve(true);
		});
		$<HTMLDialogElement>('#alert')[0].showModal();
	});
export const confirm = (text: _jquery_text_parameter) =>
	new Promise(resolve => {
		$('#confirm .message').text(text);
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
		.reduce((o, p) => (o ? o[p] : null), this);
}

export function setByString(object: object, path: string, value, seperator = /[.[\]'"]/) {
	return path
		.split(seperator)
		.filter(p => p)
		.reduce((o, p, i) => (o[p] = path.split(seperator).filter(p => p).length === ++i ? value : o[p] || {}), this);
}

export const cookies: Map<string, string> & { get _map(): Map<string, string> } = {
	clear() {
		for (const key of this.entries()) {
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

export function getIconForNode(node: SerializedNode): string {
	switch (node.nodeType) {
		case 'planet':
			return 'earth-americas';
		case 'star':
			return 'sun-bright';
		case 'ship':
			return 'triangle';
		default:
			return 'planet-ringed';
	}
}

export function getColorForBiome(biome: PlanetBiome): string {
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

export function toDegrees(radians: number): number {
	return (radians * 180) / Math.PI;
}

export function toRadians(degrees: number): number {
	return (degrees / 180) * Math.PI;
}
