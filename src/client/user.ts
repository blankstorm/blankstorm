import type { Account } from '@blankstorm/api';
import type { Player } from '../core/nodes/Player';
import { currentLevel } from './client';
import { sendMessage } from './chat';
import type { System } from '../core/System';

export const account: Account = {
	id: '_guest_',
	username: '[guest]',
	type: 0,
	lastchange: undefined,
	created: undefined,
	is_disabled: false,
};

export function chat(...messages: string[]) {
	for (const message of messages) {
		sendMessage(`${account.username}: ${message}`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
	}
}

export function player(): Player {
	return <Player>system()?.nodes?.get(account.id);
}

export function system(): System {
	return currentLevel?.getNodeSystem(account.id);
}
