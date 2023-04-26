import Items from './items.js';

import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import ships from './entities/ships.js';

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
	#path;
	#fs;
	constructor(path, fs) {
		this.#path = path;
		this.#fs = fs;
	}

	#read() {
		const content = this.#fs.readFileSync(this.#path, 'utf8');
		return new Map(Object.entries(JSON.parse(content)));
	}

	#write(map) {
		const content = JSON.stringify(Object.fromEntries(map));
		this.#fs.writeFileSync(this.#path, content);
	}

	clear() {
		this.#fs.writeFileSync(this.#path, '{}');
	}

	delete(key) {
		const map = this.#read();
		map.delete(key);
		this.#write(map);
	}

	get(key) {
		const map = this.#read();
		return map.get(key);
	}

	has(key) {
		const map = this.#read();
		return map.has(key);
	}

	set(key, value) {
		const map = this.#read();
		map.set(key, value);
		this.#write(map);
	}

	get size() {
		return this.#read().size;
	}

	[Symbol.iterator]() {
		return this.#read[Symbol.iterator];
	}

	get keys() {
		return this.#read.keys;
	}

	get values() {
		return this.#read.values;
	}

	get entries() {
		return this.#read.entries;
	}

	get forEach() {
		return this.#read.forEach;
	}
}

/**
 * A Map overlaying a folder
 */
export class FolderMap /* implements Map */ {
	#path;
	#fs;
	constructor(path, fs) {
		this.#path = path;
		this.#fs = fs;
	}

	#readNames() {
		return this.#fs.readdirSync(this.#path);
	}

	#join(path) {
		return `${this.#path}/${path}`;
	}

	#getMap() {
		const map = new Map();
		for (let name of this.#readNames()) {
			const content = this.#fs.readFileSync(this.#join(name), 'utf8');
			map.set(name, content);
		}
	}

	clear() {
		for (let name of this.#readNames()) {
			this.#fs.unlinkSync(this.#join(name));
		}
	}

	delete(key) {
		if (key in this.#readNames()) {
			this.#fs.unlinkSync(this.#join(key));
		}
	}

	get(key) {
		if (this.has(key)) {
			return this.#fs.readFileSync(this.#join(key), 'utf8');
		}
	}

	has(key) {
		return key in this.#readNames();
	}

	set(key, value) {
		this.#fs.writeFileSync(this.#join(key), value);
	}

	get size() {
		return this.#readNames().length;
	}

	get [Symbol.iterator]() {
		return this.#getMap()[Symbol.iterator];
	}

	get keys() {
		return this.#getMap().keys;
	}

	get values() {
		return this.#getMap().values;
	}

	get entries() {
		return this.#getMap().entries;
	}

	get forEach() {
		return this.#getMap().forEach;
	}
}
