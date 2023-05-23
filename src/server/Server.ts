import { createServer } from 'node:http';
import EventEmitter from 'node:events';
import { Server as SocketIOServer } from 'socket.io';

import { version } from '../core/meta';
import type { VersionID } from '../core/meta';
import { execCommandString } from './commands';
import { requestUserInfo } from '../core/api';
import { Level } from '../core/Level';
import type { SerializedLevel } from '../core/Level';

import { Log, LogLevel } from './Log';
import { Client, ClientStore } from './Client';
import { captureArrayUpdates } from './utils';
import type { Server as HTTPServer } from 'node:http';
import type { LevelEvent } from '../core/events';
import type { ServerOptions as EngineIOOptions } from 'engine.io';

export interface ServerPingInfo {
	current_clients: number;
	max_clients: number;
	message: number;
	version: VersionID;
	uptime?: number;
}

export interface ServerConfig {
	whitelist: boolean;
	blacklist: boolean;
	max_clients: number;
	message: string;
	log_verbose: boolean;
	debug_mode: boolean;
	port?: number;
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
	levelData?: SerializedLevel;
}

export class Server extends EventEmitter {
	whitelist: string[];
	blacklist: string[];
	config: ServerConfig;
	ops: OpsEntry[];
	clients = new ClientStore();
	log = new Log();
	isStopping = false;
	io: SocketIOServer;
	level: Level;
	httpServer: HTTPServer;

	constructor({ config, levelData = null, whitelist = [], blacklist = [], ops = [] }) {
		super();

		//capture events from list updates
		const { proxy: whitelistProxy, emitter: whitelistEmitter } = captureArrayUpdates(whitelist);
		this.whitelist = whitelistProxy;
		whitelistEmitter.on('update', () => this.emit('update_whitelist'));

		const { proxy: blacklistProxy, emitter: blacklistEmitter } = captureArrayUpdates(blacklist);
		this.blacklist = blacklistProxy;
		blacklistEmitter.on('update', () => this.emit('update_backlist'));

		const { proxy: opsProxy, emitter: opsEmitter } = captureArrayUpdates(ops);
		this.ops = opsProxy;
		opsEmitter.on('update', () => this.emit('update_ops'));

		this.httpServer = createServer((req, res) => {
			res.setHeader('Access-Control-Allow-Origin', '*');
			switch (req.url) {
				case '/ping':
					const data: ServerPingInfo = {
						current_clients: this.io.sockets.sockets.size,
						max_clients: config.max_clients,
						message: config.message,
						version,
					};
					if (config.debug?.public_uptime) data.uptime = process.uptime();
					res.end(JSON.stringify(data));
					break;
				case '/log':
					if (config.debug?.public_log) {
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
					this.log.addMessage('Client auth failed: ' + err.stack, LogLevel.ERROR);
					next(new Error('Server error'));
				}
			}
		});

		this.io.on('connection', socket => {
			const client = this.clients.get(socket.id);
			this.addClient(client);
		});

		if (levelData) {
			this.level = Level.FromData(levelData);
		} else {
			this.log.addMessage('No level detected. Generating...');
			this.level = new Level('server_level');
		}

		for (const type of ['projectile.fire', 'level.tick', 'player.death', 'entity.follow_path.start']) {
			this.level.addEventListener(type, async (evt: LevelEvent) => {
				this.io.emit('event', type, evt.emitter, evt.data);
			});
		}

		setInterval(() => {
			this.level.tick();
		}, 1000 / Level.TickRate);

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

	listen(...args) {
		return new Promise<void>(resolve => {
			this.httpServer.listen(...args, resolve);
		});
	}

	save() {
		this.log.addMessage('Saved the current level');
		this.emit('save');
	}

	stop(logLevel: LogLevel = LogLevel.LOG) {
		this.isStopping = true;
		this.log.addMessage('Stopping...', logLevel);
		for (const client of this.clients.values()) {
			client.kick('Server shutting down');
		}
		this.io.close();
		this.httpServer.close();
		this.log.addMessage('Stopped', logLevel);
		this.emit('stop');
	}

	restart(logLevel: LogLevel = LogLevel.LOG, restartProcess = false) {
		this.isStopping = true;
		this.log.addMessage('Restarting...', logLevel);
		for (const client of this.clients.values()) {
			client.kick('Server restarting');
		}
		this.io.close();
		this.httpServer.close();
		this.log.addMessage('Restarted', logLevel);
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
			this.log.addMessage(`${client.name} left (${message})`);
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
			this.log.addMessage(`[Chat] ${client.name}: ${data}`);
			this.io.emit('chat', `${client.name}: ${data}`);
		});
	}

	async checkClientAuth(socket) {
		if (this.isStopping) {
			throw 'Server is stopping or restarting';
		}

		let data;
		try {
			data = await requestUserInfo('token', socket.handshake.auth.token);
		} catch (err) {
			if (!data) {
				// the fetch failed (instead of the request being invalid)
				this.log.addMessage('Client auth API request failed: ' + err.stack, LogLevel.WARN);
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
		this.log.addMessage(`${client.name} connected with socket id ${socket.id}`);
		this.io.emit('chat', `${client.name} joined`);
		return;
	}
}
