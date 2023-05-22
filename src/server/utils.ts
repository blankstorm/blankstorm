import * as fs from 'fs';
import { isJSON } from '../core/utils';
import EventEmitter from 'events';

export function readJSONFile(path) {
	if (!fs.existsSync(path)) {
		return false;
	}

	const content = fs.readFileSync(path, { encoding: 'utf8' });

	if (!isJSON(content)) {
		return false;
	}

	return JSON.parse(content);
}

export function captureArrayUpdates(array) {
	let cache = array;
	const emitter = new EventEmitter(),
		update = newArray => {
			if (cache.length != newArray.length) {
				emitter.emit('update');
				cache = newArray;
				return;
			}

			for (let i = 0; i < newArray.length; i++) {
				if (newArray[i] != cache[i]) {
					emitter.emit('update');
					cache = newArray;
					return;
				}
			}
		};
	return {
		proxy: new Proxy(array, {
			get(target, prop) {
				if (typeof target[prop] != 'function') {
					return target[prop];
				}
				return (...args) => {
					const rv = target[prop](...args);
					update(target);
					return rv;
				};
			},

			set(target, prop, value): boolean {
				target[prop] = value;
				update(target);
				return true;
			},
		}),
		emitter,
	};
}
