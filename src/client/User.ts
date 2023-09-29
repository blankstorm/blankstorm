import type { Account } from '@blankstorm/api';
import type { Player } from '../core/nodes/Player';
import { ClientSystem } from './ClientSystem';
import { Client } from './client';

export class User implements Account {

	id = '_guest_';
	username = '[guest]';
	oplvl = 0;
	lastchange = undefined;
	created = undefined;
	disabled = false;

	constructor(public client: Client) {}

	chat(...msg) {
		for (const m of msg) {
			this.client.sendChatMessage(`${this.username} = ${m}`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
		}
	}
	data(id: string = this.id) {
		const level = this.client.current.isServer ? this.client.servers.get(this.client.servers.selected).level : this.client.current;
		const player = level?.getNodeSystem(id)?.nodes?.get(id);
		return player as unknown as Player;
	}

	get system(): ClientSystem {
		return this.client.current?.getNodeSystem(this.client.current.activePlayer);
	}
}
