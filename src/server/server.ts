import { getAccount } from '@blankstorm/api';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import type { Socket } from 'socket.io';
import { Level, levelEventNames, type LevelJSON } from '../core/level.js';
import type { VersionID } from '../core/metadata.js';
import { config as coreConfig } from '../core/metadata.js';
import { Client, addClient, clients, getClientByID } from './clients.js';
import { blacklist, config, ops, whitelist } from './config.js';
import { http, io } from './transport.js';
import { logger } from './utils.js';

export interface PingInfo {
	current_clients: number;
	max_clients: number;
	message: string;
	version: VersionID;
	uptime?: number;
}

let isStopping = false;

export let level: Level, levelData: LevelJSON | undefined;

export function init() {
	io.use(async (socket, next) => {
		await checkClientAuth(socket).catch(error => {
			if (error instanceof Error) {
				logger.error('Client auth failed: ' + error.stack);
				next(new Error('Server error'));
			} else {
				next(new Error(error + ''));
			}
		});
		next();
	});

	io.on('connection', socket => {
		addClient(clients.get(socket.id)!);
	});

	if (levelData) {
		level = Level.FromJSON(levelData);
	} else {
		logger.log('No level detected. Generating...');
		level = new Level();
	}

	for (const type of levelEventNames) {
		level.on(type, (...args) => {
			io.emit('event', type, ...args);
		});
	}

	setInterval(() => {
		level.update();
	}, 1000 / coreConfig.tick_rate);

	setInterval(() => {
		clients.forEach(client => {
			if (client.sentPackets > 50) {
				client.kick('Sending to many packets');
			}
			client.sentPackets = 0;
		});
	}, 1000);
}

export function save() {
	logger.log('Saved the current level');
	writeFileSync('level.json', JSON.stringify(level.toJSON()));
}

export function stop() {
	isStopping = true;
	logger.log('Stopping...');
	for (const client of clients.values()) {
		client.kick('Server shutting down');
	}
	io.close();
	http.close();
	logger.log('Stopped');
	process.exit();
}

export function restart() {
	isStopping = true;
	logger.log('Restarting...');
	for (const client of clients.values()) {
		client.kick('Server restarting');
	}
	io.close();
	http.close();
	logger.log('Restarted');
	setTimeout(() => {
		process.on('exit', () => {
			spawn(process.argv.shift()!, process.argv, {
				cwd: process.cwd(),
				detached: true,
				stdio: 'inherit',
			});
		});
	}, 1000);
	process.exit();
}

export async function checkClientAuth(socket: Socket) {
	if (isStopping) {
		throw 'Server is stopping or restarting';
	}

	const account = await getAccount('token', socket.handshake.auth.token).catch((error: Error) => {
		logger.warn('API request for client authentication failed: ' + error.stack);
		throw 'Authentication request failed';
	});

	if (!account) {
		logger.warn('Invalid account data recieved');
		throw 'Invalid account';
	}

	if (config.whitelist && !whitelist.has(account.id)) {
		throw 'You are not whitelisted';
	}

	if (config.blacklist && blacklist.has(account.id)) {
		throw 'You are banned from this server';
	}

	if (+account.is_disabled) {
		throw 'Your account is disabled';
	}

	if (io.sockets.sockets.size >= config.max_clients && ![...ops].some(op => op.id == account.id && op.bypassLimit)) {
		throw 'Server full';
	}

	if (getClientByID(account.id)) {
		throw 'Already connected';
	}

	const client = new Client(account.id, level.rootSystem, socket);
	client.name = account.username;
	clients.set(socket.id, client);
	logger.log(`${client.name} connected with socket id ${socket.id}`);
	io.emit('chat', `${client.name} joined`);
	return;
}
