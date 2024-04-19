import type { Account } from '@blankstorm/api';
import type { Action, ActionParameters } from '../core';
import type { Player } from '../core/entities/player';
import type { System } from '../core/system';
import { sendMessage } from './chat';
import { currentLevel } from './client';

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
	return currentLevel?.getEntityByID(account.id);
}

export function system(): System {
	return player()?.system;
}

export function action<T extends Action>(action: T, ...args: ActionParameters<T>): Promise<boolean> {
	return currentLevel.tryAction<T>(account.id, action, ...args);
}
