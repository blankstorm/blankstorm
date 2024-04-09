import { createServer } from 'node:http';
import type { Server as HTTPServer } from 'node:http';
import EventEmitter from 'node:events';
import { Server as SocketIOServer } from 'socket.io';
import type { Socket } from 'socket.io';
import type { ServerOptions as EngineIOOptions } from 'engine.io';
import { getAccount } from '@blankstorm/api';

import { version, config as coreConfig } from '../core/metadata';
import type { VersionID } from '../core/metadata';
import { execCommandString } from './commands';
import { Level } from '../core/level';
import type { LevelJSON } from '../core/level';

import { Logger } from 'logzen';
import { Client, ClientStore } from './Client';
import { captureArrayUpdates } from './utils';

export interface PingInfo {
	current_clients: number;
	max_clients: number;
	message: string;
	version: VersionID;
	uptime?: number;
}

export interface ServerConfig {
	whitelist: boolean;
	blacklist: boolean;
	max_clients: number;
	message: string;
	debug: boolean;
	port: number;
	public_uptime: boolean;
	public_log: boolean;
}

export interface OpsEntry {
	bypassLimit: boolean;
	oplvl: number;
}

export interface ServerOptions {
	config: ServerConfig;
	whitelist?: string[];
	blacklist?: string[];
	ops?: OpsEntry[];
	levelData?: LevelJSON;
}

// see https://stackoverflow.com/a/71689964/17637456
type _Wrap<T> = { [K in keyof T]-?: [T[K]] };
type _Unwrap<T> = { [K in keyof T]: Extract<T[K], [unknown]>[0] };
type InitialParameters<F extends (...args: unknown[]) => unknown> = _Wrap<Parameters<F>> extends [...infer InitPs, unknown] ? _Unwrap<InitPs> : never;

export class Server extends EventEmitter {
	whitelist: string[];
	blacklist: string[];
	config: ServerConfig;
	ops: OpsEntry[];
	clients = new ClientStore();
	log = new Logger();
	isStopping = false;
	io: SocketIOServer;
	level: Level;
	httpServer: HTTPServer;

	constructor({ config: serverConfig, levelData = null, whitelist = [], blacklist = [], ops = [] }: Partial<ServerOptions>) {
		super();
		this.config = serverConfig;

		//capture events from list updates
		const { proxy: whitelistProxy, emitter: whitelistEmitter } = captureArrayUpdates(whitelist);
		this.whitelist = whitelistProxy;
		whitelistEmitter.on('update', () => this.emit('whitelist.update'));

		const { proxy: blacklistProxy, emitter: blacklistEmitter } = captureArrayUpdates(blacklist);
		this.blacklist = blacklistProxy;
		blacklistEmitter.on('update', () => this.emit('backlist.update'));

		const { proxy: opsProxy, emitter: opsEmitter } = captureArrayUpdates(ops);
		this.ops = opsProxy;
		opsEmitter.on('update', () => this.emit('ops.update'));

		this.httpServer = createServer((req, res) => {
			res.setHeader('Access-Control-Allow-Origin', '*');
			switch (req.url) {
				case '/ping':
					const data: PingInfo = {
						current_clients: this.io.sockets.sockets.size,
						max_clients: serverConfig.max_clients,
						message: serverConfig.message,
						version,
					};
					if (serverConfig.public_uptime) data.uptime = process.uptime();
					res.end(JSON.stringify(data));
					break;
				case '/log':
					if (serverConfig.public_log) {
						res.end(this.log.toString());
					} else {
						res.statusCode = 403;
						res.end('Log is not public.');
					}
					break;
			}
		});

		this.io = new SocketIOServer(this.httpServer, {
			pingInterval: 1000,
			pingTimeout: 10000,
			cors: '*',
		} as EngineIOOptions);

		this.io.use(async (socket, next) => {
			try {
				await this.checkClientAuth(socket);
				next();
			} catch (err) {
				if (typeof err == 'string') {
					next(new Error(err));
				} else {
					this.log.error('Client auth failed: ' + err.stack);
					next(new Error('Server error'));
				}
			}
		});

		this.io.on('connection', socket => {
			const client = this.clients.get(socket.id);
			this.addClient(client);
		});

		if (levelData) {
			this.level = Level.FromJSON(levelData);
		} else {
			this.log.log('No level detected. Generating...');
			this.level = new Level();
		}

		for (const type of ['projectile_fire', 'tick', 'player_removed', 'entity_path_start'] as const) {
			this.level.on(type, async (...args) => {
				this.io.emit('event', type, ...args);
			});
		}

		setInterval(() => {
			this.level.tick();
		}, 1000 / coreConfig.tick_rate);

		setInterval(() => {
			this.clients.forEach(client => {
				if (client.sentPackets > 50) {
					client.kick('Sending to many packets');
				}
				client.sentPackets = 0;
			});
		}, 1000);

		this.io.attach(this.httpServer);
	}

	listen(...args: InitialParameters<HTTPServer['listen']>): Promise<void> {
		return new Promise<void>(resolve => {
			this.httpServer.listen(...args, resolve);
		});
	}

	save() {
		this.log.log('Saved the current level');
		this.emit('save');
	}

	stop() {
		this.isStopping = true;
		this.log.log('Stopping...');
		for (const client of this.clients.values()) {
			client.kick('Server shutting down');
		}
		this.io.close();
		this.httpServer.close();
		this.log.log('Stopped');
		this.emit('stop');
	}

	restart(restartProcess = false) {
		this.isStopping = true;
		this.log.log('Restarting...');
		for (const client of this.clients.values()) {
			client.kick('Server restarting');
		}
		this.io.close();
		this.httpServer.close();
		this.log.log('Restarted');
		this.emit('restart', restartProcess);
	}

	addClient(client: Client) {
		this.io.emit(
			'playerlist',
			[...this.clients.values()].slice(0, 25).map(client => client.name)
		);
		client.socket.onAny(() => {
			client.sentPackets++;
		});
		client.socket.on('disconnect', reason => {
			const message = Client.GetDisconnectReason(reason);
			this.log.log(`${client.name} left (${message})`);
			this.io.emit('chat', `${client.name} left`);
			this.clients.delete(client.socket.id);
			this.io.emit(
				'playerlist',
				[...this.clients.values()].slice(0, 25).map(client => client.name)
			);
		});
		client.socket.on('command', commandString => {
			const result = execCommandString(commandString, { executor: client, server: this });
			if (result) {
				client.socket.emit('chat', result);
			}
		});
		client.socket.on('chat', data => {
			this.log.log(`(Chat) ${client.name}: ${data}`);
			this.io.emit('chat', `${client.name}: ${data}`);
		});
	}

	async checkClientAuth(socket: Socket) {
		if (this.isStopping) {
			throw 'Server is stopping or restarting';
		}

		let data;
		try {
			data = await getAccount('token', socket.handshake.auth.token);
		} catch (err) {
			if (!data) {
				// the fetch failed (instead of the request being invalid)
				this.log.warn('Client auth API request failed: ' + err.stack);
				throw 'Auth request failed';
			}

			throw 'Invalid token';
		}

		const clientData = data.result;

		if (this.config.whitelist && !this.whitelist.includes(clientData.id)) {
			throw 'You are not whitelisted';
		}

		if (this.config.blacklist && this.blacklist.includes(clientData.id)) {
			throw 'You are banned from this server';
		}

		if (+clientData.disabled) {
			throw 'Your account is disabled';
		}

		if (this.io.sockets.sockets.size >= this.config.max_clients && !(this.ops[clientData.id] && this.ops[clientData.id].bypassLimit)) {
			throw 'Server full';
		}

		if (this.clients.getByID(clientData.id)) {
			throw 'Already connected';
		}

		const client = new Client(clientData.id, this, { socket, fleet: [] });
		client.name = clientData.username;
		this.clients.set(socket.id, client);
		this.log.log(`${client.name} connected with socket id ${socket.id}`);
		this.io.emit('chat', `${client.name} joined`);
		return;
	}
}
