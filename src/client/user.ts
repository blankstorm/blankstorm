import type { Account } from '@blankstorm/api';
import type { Player } from '../core/nodes/Player';
import { ClientSystem } from './system';
import { currentLevel, sendChatMessage } from './client';
import * as servers from './servers';

export const account: Account = {
	id: '_guest_',
	username: '[guest]',
	type: 0,
	lastchange: undefined,
	created: undefined,
	is_disabled: false,
};

export function chat(...message: string[]) {
	for (const chunk of message) {
		sendChatMessage(`${account.username} = ${chunk}`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
	}
}

export function player(): Player {
	const level = currentLevel.isServer ? servers.get(servers.selected).level : currentLevel;
	return <Player>level?.getNodeSystem(account.id)?.nodes?.get(account.id);
}

export function system(): ClientSystem {
	return currentLevel?.getNodeSystem(currentLevel.activePlayer);
}
