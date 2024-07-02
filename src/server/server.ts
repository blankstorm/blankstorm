import { getAccount } from '@blankstorm/api';
import { spawn } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import type { Socket } from 'socket.io';
import { Level, levelEventNames, type LevelJSON } from '../core/level';
import type { VersionID } from '../core/metadata';
import { config as coreConfig } from '../core/metadata';
import { Client, addClient, clients, getClientByID } from './clients';
import { blacklist, config, ops, whitelist } from './config';
import { http, io } from './transport';
import { logger } from './utils';

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
		try {
			await checkClientAuth(socket);
			next();
		} catch (err) {
			if (typeof err == 'string') {
				next(new Error(err));
			} else {
				logger.error('Client auth failed: ' + err.stack);
				next(new Error('Server error'));
			}
		}
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
		level.on(type, async (...args) => {
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

export function restart(restartProcess = false) {
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

	let data;
	try {
		data = await getAccount('token', socket.handshake.auth.token);
	} catch (err) {
		if (!data) {
			// the fetch failed (instead of the request being invalid)
			logger.warn('Client auth API request failed: ' + err.stack);
			throw 'Auth request failed';
		}

		throw 'Invalid token';
	}

	const clientData = data.result;

	if (config.whitelist && !whitelist.has(clientData.id)) {
		throw 'You are not whitelisted';
	}

	if (config.blacklist && blacklist.has(clientData.id)) {
		throw 'You are banned from this server';
	}

	if (+clientData.disabled) {
		throw 'Your account is disabled';
	}

	if (io.sockets.sockets.size >= config.max_clients && !(ops[clientData.id] && ops[clientData.id].bypassLimit)) {
		throw 'Server full';
	}

	if (getClientByID(clientData.id)) {
		throw 'Already connected';
	}

	const client = new Client(clientData.id, socket);
	client.name = clientData.username;
	clients.set(socket.id, client);
	logger.log(`${client.name} connected with socket id ${socket.id}`);
	io.emit('chat', `${client.name} joined`);
	return;
}
