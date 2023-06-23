import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { config } from './meta';
import type * as FS from 'fs';

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
	const a = [];
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
	bool() {
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
	cords: (dis = 1, y0?: boolean) => {
		const angle = Math.random() * Math.PI * 2,
			angle2 = Math.random() * Math.PI * 2;

		const x = dis * Math.cos(angle),
			y = y0 ? 0 : dis * Math.sin(angle) * Math.cos(angle2),
			z = dis * Math.sin(angle) * (y0 ? 1 : Math.sin(angle2));
		return new Vector3(x, y, z);
	},
};
export const wait = (time: number) => new Promise(resolve => setTimeout(resolve, time));

export function xpToLevel(xp: number) {
	return Math.sqrt(xp / 10);
}

export function levelToXp(level: number) {
	return 10 * level ** 2;
}

export type JSONValue = string | number | boolean | { [x: string]: JSONValue } | Array<JSONValue>;

/**
 * A Map overlaying a JSON file
 */
export class JSONFileMap /* implements Map */ {
	path: string;
	#fs: typeof FS;
	constructor(path: string, fs) {
		this.path = path;
		this.#fs = fs;

		if (!fs.existsSync(path)) {
			fs.writeFileSync(path, '{}');
		}
	}

	get _map(): Map<string, JSONValue> {
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

	_write(map: Map<string, JSONValue>) {
		if (!this.#fs.existsSync(this.path)) {
			this.#fs.writeFileSync(this.path, '{}');
		}
		const content = JSON.stringify(Object.fromEntries(map));
		this.#fs.writeFileSync(this.path, content);
	}

	clear() {
		this.#fs.writeFileSync(this.path, '{}');
	}

	delete(key: string) {
		const map = this._map;
		map.delete(key);
		this._write(map);
	}

	get<T = JSONValue>(key: string): T {
		return this._map.get(key) as T;
	}

	has(key: string): boolean {
		return this._map.has(key);
	}

	set(key: string, value: JSONValue) {
		const map = this._map;
		map.set(key, value);
		this._write(map);
	}

	get size() {
		return this._map.size;
	}

	get [Symbol.iterator]() {
		const map = this._map;
		return map[Symbol.iterator].bind(map);
	}

	get keys() {
		const map = this._map;
		return map.keys.bind(map);
	}

	get values() {
		const map = this._map;
		return map.values.bind(map);
	}

	get entries() {
		const map = this._map;
		return map.entries.bind(map);
	}

	get forEach() {
		const map = this._map;
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

	get _names(): string[] {
		return this._fs
			.readdirSync(this._path)
			.filter(p => p.endsWith(this._suffix))
			.map(p => p.slice(0, -this._suffix.length));
	}

	_join(path: string): string {
		return `${this._path}/${path}${this._suffix}`;
	}

	get _map(): Map<string, string> {
		const entries = [];
		for (const name of this._names) {
			const content = this._fs.readFileSync(this._join(name), 'utf8');
			entries.push([name, content]);
		}
		return new Map(entries);
	}

	clear(): void {
		for (const name of this._names) {
			this._fs.unlinkSync(this._join(name));
		}
	}

	delete(key: string) {
		if (this.has(key)) {
			this._fs.unlinkSync(this._join(key));
		}
	}

	get(key: string): string {
		if (this.has(key)) {
			return this._fs.readFileSync(this._join(key), 'utf8');
		}
	}

	has(key: string): boolean {
		return this._names.includes(key);
	}

	set(key: string, value: string): void {
		this._fs.writeFileSync(this._join(key), value);
	}

	get size() {
		return this._names.length;
	}

	get [Symbol.iterator]() {
		const map = this._map;
		return map[Symbol.iterator].bind(map);
	}

	get keys() {
		const map = this._map;
		return map.keys.bind(map);
	}

	get values() {
		const map = this._map;
		return map.values.bind(map);
	}

	get entries() {
		const map = this._map;
		return map.entries.bind(map);
	}

	get forEach() {
		const map = this._map;
		return map.forEach.bind(map);
	}
}

export function resolveConstructors(object): string[] {
	const constructors = [];
	let prototype = object;
	while (prototype && !['Function', 'Object'].includes(prototype.constructor.name)) {
		prototype = Object.getPrototypeOf(prototype);
		constructors.push(prototype.constructor.name);
	}
	return constructors;
}

export function toDegrees(radians: number): number {
	return (radians * 180) / Math.PI;
}

export function toRadians(degrees: number): number {
	return (degrees / 180) * Math.PI;
}

/**
 * Gets a random int, r, with the probability P(r) = (base)**r
 * For example, with a probability of 1/2: P(1) = 1/2, P(2) = 1/4, etc.
 * @param probability the probability
 */
export function getRandomIntWithRecursiveProbability(probability = 0.5): number {
	return -Math.floor(Math.log(Math.random()) / Math.log(1 / probability));
}
