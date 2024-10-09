import { logger } from './utils.js';

export let path: string;

export function setPath(value: string) {
	logger.debug('Using data path: ' + value);
	path = value;
}

export let debug: boolean = false;

export function setDebug(value: boolean) {
	debug = value;
}

export let isServer: boolean = false;

export function setServer(value: boolean): void {
	isServer = value;
}

export let isPaused: boolean;

export function pause() {
	logger.debug('Paused');
	isPaused = true;
}

export function unpause() {
	logger.debug('Unpaused');
	isPaused = false;
}

export let hitboxesEnabled: boolean = false;
export function toggleHitboxes() {
	hitboxesEnabled = !hitboxesEnabled;
}

export let isMultiplayerEnabled: boolean = false;

export function enableMultiplayer() {
	isMultiplayerEnabled = true;
}
