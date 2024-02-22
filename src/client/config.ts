import { logger } from './utils';

export let path: string;

export function setPath(value: string) {
	logger.debug('Using data path: ' + value);
	path = value;
}

export let debug: boolean = false;

export function setDebug(value: boolean) {
	debug = value;
}
