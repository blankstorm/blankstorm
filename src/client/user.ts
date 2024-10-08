import type { Account } from '@blankstorm/api';
import type { ActionType, ActionData } from '../core';
import type { Player } from '../core/entities/player';
import type { System } from '../core/system';
import { sendMessage } from './chat';
import { level } from './level';

export const account: Account = {
	id: '_guest_',
	username: '[guest]',
	type: 0,
	lastchange: new Date(),
	created: new Date(),
	is_disabled: false,
};

export function chat(...messages: string[]) {
	for (const message of messages) {
		sendMessage(`${account.username}: ${message}`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
	}
}

export function player(): Player {
	return level!.getEntityByID(account.id);
}

export function hasPlayer(): boolean {
	try {
		player();
		return true;
	} catch (_) {
		return false;
	}
}

export function system(): System {
	return player()?.system;
}

export function hasSystem(): boolean {
	try {
		system();
		return true;
	} catch (_) {
		return false;
	}
}

/**
 * @todo Fix this so it works with servers
 */
export async function action<T extends ActionType>(action: T, data: ActionData<T>): Promise<boolean> {
	return level!.tryAction(account.id, action, data);
}
