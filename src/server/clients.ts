import type { Socket } from 'socket.io';
import type { PlayerJSON } from '../core/entities/player';
import { Player } from '../core/entities/player';
import { level } from './server';
import { blacklist } from './config';
import { execCommandString } from './commands';
import { logger } from './utils';
import { io } from './transport';

export class Client extends Player {
	lastMessager?: Client;
	sentPackets = 0;
	constructor(
		id: string,
		public readonly socket: Socket
	) {
		super(id, level);
		this.socket = socket;
	}

	kick(message: string) {
		this.socket.emit('kick', message);
		this.socket.disconnect();
	}

	ban(message: string) {
		this.kick(`You have been banned from this server: ${message}`);
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

export function getClientBy(attr: string, val): Client {
	for (const client of clients.values()) {
		if (client[attr] == val) {
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
	client.socket.on('command', commandString => {
		const result = execCommandString(commandString, { executor: client });
		if (result) {
			client.socket.emit('chat', result);
		}
	});
	client.socket.on('chat', data => {
		logger.log(`(Chat) ${client.name}: ${data}`);
		io.emit('chat', `${client.name}: ${data}`);
	});
}
