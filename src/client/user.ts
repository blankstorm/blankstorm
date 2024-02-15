import type { Account } from '@blankstorm/api';
import type { Player } from '../core/nodes/Player';
import { ClientSystem } from './system';
import { Client } from './client';

export class User implements Account {
	id = '_guest_';
	username = '[guest]';
	type = 0;
	lastchange = undefined;
	created = undefined;
	is_disabled = false;

	constructor(public client: Client) {}

	chat(...message: string[]) {
		for (const chunk of message) {
			this.client.sendChatMessage(`${this.username} = ${chunk}`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
		}
	}

	data(): Player {
		const level = this.client.currentLevel.isServer ? this.client.servers.get(this.client.servers.selected).level : this.client.currentLevel;
		return <Player>level?.getNodeSystem(this.id)?.nodes?.get(this.id);
	}

	get system(): ClientSystem {
		return this.client.currentLevel?.getNodeSystem(this.client.currentLevel.activePlayer);
	}
}
