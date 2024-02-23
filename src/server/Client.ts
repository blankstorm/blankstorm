import type { Server } from './Server';
import { Player } from '../core/nodes/Player';
import type { SerializedPlayer } from '../core/nodes/Player';
import type { Socket } from 'socket.io';
import type { Ship } from '../core/nodes/Ship';

export class Client extends Player {
	socket: Socket;
	lastMessager?: Client;
	declare oplvl: number;
	sentPackets = 0;
	constructor(id: string, public server: Server, { fleet, socket }: { fleet: Ship[]; socket: Socket }) {
		super(id, server.level.getNodeSystem(id), { fleet });
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

	toJSON(): SerializedPlayer {
		return Object.assign(super.toJSON(), { nodeType: 'Player' });
	}

	static GetDisconnectReason(reason: string): string {
		const reasons = new Map([
			['server namespace disconnect', 'Disconnected by server'],
			['client namespace disconnect', 'Client disconnected'],
			['ping timeout', 'Connection timed out'],
			['transport close', 'Lost Connection'],
			['transport error', 'Connection failed'],
		]);
		return reasons.has(reason) ? reasons.get(reason) : reason;
	}
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
	}

	getByID(id: string): Client {
		return this.getBy('id', id);
	}

	getByName(name: string): Client {
		return this.getBy('name', name);
	}
}
