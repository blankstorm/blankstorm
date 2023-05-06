import Items from './items.js';

import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import ships from './entities/ships.js';
import { config } from './meta.js';

export const filterObject = (object, ...keys) => Object.fromEntries(Object.entries(object).filter(([key]) => keys.includes(key)));
export const greek = [
	'Alpha',
	'Beta',
	'Gamma',
	'Delta',
	'Epsilon',
	'Zeta',
	'Eta',
	'Theta',
	'Iota',
	'Kappa',
	'Lambda',
	'Mu',
	'Nu',
	'Xi',
	'Omicron',
	'Pi',
	'Rho',
	'Sigma',
	'Tau',
	'Upsilon',
	'Phi',
	'Chi',
	'Psi',
	'Omega',
];
export const range = (min, max) => {
	let a = [];
	for (let i = min; i < max; i++) {
		a.push(i);
	}
	return a;
};

//utility functions
export const isHex = str => /^[0-9a-f-.]+$/.test(str);
export const isJSON = str => {
	try {
		JSON.parse(str);
		return true;
	} catch (e) {
		return false;
	}
};
export const random = {
	float: (min = 0, max = 1) => Math.random() * (max - min) + min,
	hex: (length = 1) => {
		let s = '';
		for (let i = 0; i < length; i++) {
			s += Math.floor(Math.random() * 16).toString(16);
		}
		return s;
	},
	get bool() {
		return !!Math.round(Math.random());
	},
	bin: (length = 1) => {
		let b = '';
		for (let i = 0; i < length; i++) {
			b += Math.round(Math.random());
		}
		return b;
	},
	int: (min = 0, max = 1) => Math.round(Math.random() * (max - min) + min),
	cords: (dis = 1, y0) => {
		let angle = Math.random() * Math.PI * 2,
			angle2 = Math.random() * Math.PI * 2;
		return y0
			? new Vector3(dis * Math.cos(angle), 0, dis * Math.sin(angle))
			: new Vector3(dis * Math.cos(angle), dis * Math.sin(angle) * Math.cos(angle2), dis * Math.sin(angle) * Math.sin(angle2));
	},
};
export const generate = {
	enemies: power => {
		//enemy spawning algorithm
		let e = [];
		e.power = power;
		let generic = [...ships];
		generic.sort((a, b) => b[1].power - a[1].power); //decending
		for (let [name, ship] of generic) {
			for (let j = 0; j < Math.floor(power / ship.power); j++) {
				e.push(name);
				power -= ship.power;
			}
		}
		return e;
	},
	items: (quantity = 0, rares) => {
		let result = {};
		for (let name of Items.keys()) {
			Items.get(name).rare
				? Math.random() < Items.get(name).drop && rares
					? (result[name] = quantity / Items.get(result).value)
					: (result[name] = 0)
				: (result[name] = quantity / Items.get(name).value);
		}
		return result;
	},
};
export const wait = time => new Promise(resolve => setTimeout(resolve, time));

/**
 * A Map overlaying a JSON file
 */
export class JSONFileMap /* implements Map */ {
	path;
	#fs;
	constructor(path, fs) {
		this.path = path;
		this.#fs = fs;

		if (!fs.existsSync(path)) {
			fs.writeFileSync(path, '{}');
		}
	}

	_getMap() {
		const content = this.#fs.readFileSync(this.path, 'utf8');
		if (!isJSON(content)) {
			if (!config.overwrite_invalid_json) {
				throw new SyntaxError(`Invalid JSON file: ${this.path}`);
			}
			console.warn(`Invalid JSON file: ${this.path} (overwriting)`);
			this.clear();
			return new Map();
		}
		return new Map(Object.entries(JSON.parse(content)));
	}

	_write(map) {
		if (!this.#fs.existsSync(this.path)) {
			this.#fs.writeFileSync(this.path, '{}');
		}
		const content = JSON.stringify(Object.fromEntries(map));
		this.#fs.writeFileSync(this.path, content);
	}

	clear() {
		this.#fs.writeFileSync(this.path, '{}');
	}

	delete(key) {
		const map = this._getMap();
		map.delete(key);
		this._write(map);
	}

	get(key) {
		return this._getMap().get(key);
	}

	has(key) {
		return this._getMap().has(key);
	}

	set(key, value) {
		const map = this._getMap();
		map.set(key, value);
		this._write(map);
	}

	get size() {
		return this._getMap().size;
	}

	get [Symbol.iterator]() {
		const map = this._getMap();
		return map[Symbol.iterator].bind(map);
	}

	get keys() {
		const map = this._getMap();
		return map.keys.bind(map);
	}

	get values() {
		const map = this._getMap();
		return map.values.bind(map);
	}

	get entries() {
		const map = this._getMap();
		return map.entries.bind(map);
	}

	get forEach() {
		const map = this._getMap();
		return map.forEach.bind(map);
	}
}

/**
 * A Map overlaying a folder
 */
export class FolderMap /* implements Map */ {
	_path;
	_fs;
	_suffix;
	constructor(path, fs, suffix = '') {
		this._path = path;
		this._fs = fs;
		this._suffix = suffix;
	}

	_readNames() {
		return this._fs
			.readdirSync(this._path)
			.filter(p => p.endsWith(this._suffix))
			.map(p => p.slice(0, -this._suffix.length));
	}

	_join(path) {
		return `${this._path}/${path}${this._suffix}`;
	}

	_getMap() {
		const entries = [];
		for (let name of this._readNames()) {
			const content = this._fs.readFileSync(this._join(name), 'utf8');
			entries.push([name, content]);
		}
		return new Map(entries);
	}

	clear() {
		for (let name of this._readNames()) {
			this._fs.unlinkSync(this._join(name));
		}
	}

	delete(key) {
		if (this.has(key)) {
			this._fs.unlinkSync(this._join(key));
		}
	}

	get(key) {
		if (this.has(key)) {
			return this._fs.readFileSync(this._join(key), 'utf8');
		}
	}

	has(key) {
		return this._readNames().includes(key);
	}

	set(key, value) {
		this._fs.writeFileSync(this._join(key), value);
	}

	get size() {
		return this._readNames().length;
	}

	get [Symbol.iterator]() {
		const map = this._getMap();
		return map[Symbol.iterator].bind(map);
	}

	get keys() {
		const map = this._getMap();
		return map.keys.bind(map);
	}

	get values() {
		const map = this._getMap();
		return map.values.bind(map);
	}

	get entries() {
		const map = this._getMap();
		return map.entries.bind(map);
	}

	get forEach() {
		const map = this._getMap();
		return map.forEach.bind(map);
	}
}
