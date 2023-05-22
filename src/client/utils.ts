import $ from 'jquery';

export const web = url => `https://blankstorm.drvortex.dev/` + url,
	upload = (type, multiple = false) =>
		new Promise(res =>
			$(`<input type=file ${type ? `accept='${type}'` : ''} ${multiple ? 'multiple' : ''}>`)
				.change(e => res([...e.target.files]))[0]
				.click()
		),
	download = (data, name) => $(`<a href=${URL.createObjectURL(new Blob([data]))} download="${name ?? 'download'}"></a>`)[0].click();

export const minimize = Intl.NumberFormat('en', { notation: 'compact' }).format;

/* eslint-disable no-redeclare */
export const alert = message =>
	new Promise(resolve => {
		$('#alert .message').text(message);
		$('#alert .ok').on('click', () => {
			$('#alert')[0].close();
			resolve(true);
		});
		$('#alert')[0].showModal();
	});
export const confirm = message =>
	new Promise(resolve => {
		$('#confirm .message').text(message);
		$('#confirm .ok').on('click', () => {
			$('#confirm')[0].close();
			resolve(true);
		});
		$('#confirm .cancel').on('click', () => {
			$('#confirm')[0].close();
			resolve(false);
		});
		$('#confirm')[0].showModal();
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
		return new Map(document.cookie.split(';').map((cookie: string) => cookie.split('=', 1)) as [string, string][]);
	},
};
