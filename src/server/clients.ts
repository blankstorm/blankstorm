import type { Socket } from 'socket.io';
import { execCommandString } from '../core/commands.js';
import type { PlayerJSON } from '../core/entities/player.js';
import { Player } from '../core/entities/player.js';
import type { System } from '../core/system.js';
import { blacklist } from './config.js';
import { io } from './transport.js';
import { logger } from './utils.js';

export class Client extends Player {
	lastMessager?: Client;
	sentPackets = 0;
	constructor(
		id: string,
		system: System,
		public readonly socket: Socket
	) {
		super(id, system);
	}

	kick(message: string) {
		this.socket.emit('kick', message);
		this.socket.disconnect();
	}

	ban(message: string) {
		this.kick('You have been banned from this server: ' + message);
		blacklist.add(this.id);
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

export const clients = new Map<string, Client>();

export function getClientBy<T extends keyof Client>(key: T, value: Client[T]): Client {
	for (const client of clients.values()) {
		if (client[key] == value) {
			return client;
		}
	}

	throw new ReferenceError('Client does not exist');
}

export function getClientByID(id: string): Client {
	return getClientBy('id', id);
}

export function getClientByName(name: string): Client {
	return getClientBy('name', name);
}

export function addClient(client: Client) {
	io.emit(
		'playerlist',
		[...clients.values()].slice(0, 25).map(client => client.name)
	);
	client.socket.onAny(() => {
		client.sentPackets++;
	});
	client.socket.on('disconnect', reason => {
		const message = getDisconnectReason(reason);
		logger.log(`${client.name} left (${message})`);
		io.emit('chat', `${client.name} left`);
		clients.delete(client.socket.id);
		io.emit(
			'playerlist',
			[...clients.values()].slice(0, 25).map(client => client.name)
		);
	});
	client.socket.on('command', (command: string) => {
		const result = execCommandString(command, { executor: client });
		if (result) {
			client.socket.emit('chat', result);
		}
	});
	client.socket.on('chat', data => {
		logger.log(`(Chat) ${client.name}: ${data}`);
		io.emit('chat', `${client.name}: ${data}`);
	});
}
