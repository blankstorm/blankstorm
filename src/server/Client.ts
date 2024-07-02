import type { Socket } from 'socket.io';
import type { PlayerJSON } from '../core/entities/player';
import { Player } from '../core/entities/player';
import type { Server } from './Server';

export class Client extends Player {
	lastMessager?: Client;
	sentPackets = 0;
	constructor(
		id: string,
		public server: Server,
		public readonly socket: Socket
	) {
		super(id, server.level);
		this.socket = socket;
	}

	kick(message: string) {
		this.socket.emit('kick', message);
		this.socket.disconnect();
	}

	ban(message: string) {
		this.kick(`You have been banned from this server: ${message}`);
		this.server.blacklist.push(this.id);
	}

	toJSON(): PlayerJSON {
		return Object.assign(super.toJSON(), { nodeType: 'Player' });
	}
}

export function getDisconnectReason(reason: string): string {
	const reasons = new Map([
		['server namespace disconnect', 'Disconnected by server'],
		['client namespace disconnect', 'Client disconnected'],
		['ping timeout', 'Connection timed out'],
		['transport close', 'Lost Connection'],
		['transport error', 'Connection failed'],
	]);
	return reasons.get(reason) ?? reason;
}

export class ClientStore extends Map<string, Client> {
	constructor() {
		super();
	}

	getBy(attr: string, val): Client {
		for (const client of this.values()) {
			if (client[attr] == val) {
				return client;
			}
		}

		throw new ReferenceError('Client does not exist');
	}

	getByID(id: string): Client {
		return this.getBy('id', id);
	}

	getByName(name: string): Client {
		return this.getBy('name', name);
	}
}
