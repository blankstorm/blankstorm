import path from 'path';
import * as fs from 'fs';
import { createServer } from 'http';
import { spawn } from 'child_process';
import { Server as SocketIOServer } from 'socket.io';

import { version } from '../core/meta.js';
import { Command, commands, execCommandString } from '../core/commands.js';
import { requestUserInfo } from '../core/api.js';
import Level from '../core/Level.js';

import { readJSONFile } from './utils.js';
import { Log, LogLevel } from './Log.js';
import { Client, ClientStore } from './Client.js';

const log = new Log();

const clients = new ClientStore();
commands.set(
	'kick',
	new Command(function (player, ...reason) {
		const client = clients.getByName(player);
		if (!client) {
			return 'Player is not online or does not exist';
		}
		client.kick(reason);
		log.addMessage(`${this.executor.name} kicked ${player}. Reason: ${reason.join(' ')}`);
		return 'Kicked ' + player;
	}, 3)
);
commands.set(
	'ban',
	new Command(function (player, ...reason) {
		const client = clients.getByName(player);
		if (!client) {
			return 'Player is not online or does not exist';
		}
		client.ban(reason);
		log.addMessage(`${this.executor.name} banned ${player}. Reason: ${reason.join(' ')}`);
		return 'Banned ' + player;
	}, 4)
);
commands.set(
	'unban',
	new Command(function (player, ...reason) {
		requestUserInfo('name', player)
			.then(client => {
				blacklist.splice(blacklist.indexOf(client.id), 1);
				fs.writeFileSync('./blacklist.json', JSON.stringify(blacklist));
				log.addMessage(`${this.executor.name} unbanned ${player}. Reason: ${reason.join(' ')}`);
				this.executor.socket.emit('chat', `Unbanned ${player}`);
			})
			.catch(() => {
				this.executor.socket.emit('chat', 'Player is not online or does not exist');
			});
	}, 4)
);
commands.set(
	'log',
	new Command(function (...message) {
		log.addMessage(`${this.executor.name} logged ${message.join(' ')}`);
	}, 1)
);
commands.set(
	'msg',
	new Command(function (player, ...message) {
		if (clients.getByName(player) instanceof Client) {
			clients.getByName(player).socket.emit(`[${this.executor.name} -> me] ${message.join(' ')}`);
			log.addMessage(`[${this.executor.name} -> ${player}] ${message.join(' ')}`);
			clients.getByName(player).lastMessager = this.executor;
			return `[me -> ${this.executor.name}] ${message.join(' ')}`;
		} else {
			return 'That user is not online';
		}
	}, 0)
);
commands.set(
	'reply',
	new Command(function (...message) {
		return this.executor.lastMessager ? commands.msg.run(this.executor, [this.executor.lastMessager.name, ...message]) : 'No one messaged you yet =(';
	}, 0)
);
commands.set(
	'stop',
	new Command(function () {
		for (let client of clients.values()) {
			client.kick('Server shutting down');
		}
		process.exit();
	}, 4)
);
commands.set(
	'restart',
	new Command(function () {
		for (let client of clients.values()) {
			client.kick('Server restarting');
		}
		setTimeout(() => {
			process.on('exit', () => {
				spawn(process.argv.shift(), process.argv, {
					cwd: process.cwd(),
					detached: true,
					stdio: 'inherit',
				});
			});
			process.exit();
		}, 1000);
	}, 4)
);
commands.set(
	'save',
	new Command(function () {
		log.addMessage('Saved the current level');
		fs.writeFileSync('level.json', JSON.stringify(level.serialize()), { encoding: 'utf-8' });
		return 'Saved the current level';
	}, 4)
);

//load config and settings and things
export let config = {
		whitelist: false,
		blacklist: true,
		max_clients: 10,
		message: '',
		log_verbose: false,
		debug: {
			public_uptime: false,
			public_log: true,
		},
	},
	ops = {},
	whitelist = [],
	blacklist = [],
	levelData,
	level;

for (let [name, filePath] of Object.entries({
	config: 'config.json',
	ops: 'ops.json',
	whitelist: 'whitelist.json',
	blacklist: 'blacklist.json',
	levelData: 'level.json',
})) {
	const data = readJSONFile(filePath);
	if (data) {
		Object.assign(globalThis[name], data);
	} else {
		log.addMessage(`Failed to load "${name}" from ${path.resolve(filePath)}`, LogLevel.WARN);
	}
}

const server = createServer((req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	switch (req.url) {
		case '/ping':
			let data = {
				current_clients: io.sockets.sockets.size,
				max_clients: config.max_clients,
				message: config.message,
				version,
			};
			if (config.debug?.public_uptime) data.uptime = process.uptime();
			res.end(JSON.stringify(data));
			break;
		case '/log':
			if (config.debug?.public_log) {
				res.end(log.toString());
			} else {
				res.statusCode = 403;
				res.end('Log is not public.');
			}
			break;
	}
});

const io = new SocketIOServer(server, {
	pingInterval: 1000,
	pingTimeout: 10000,
	cors: '*',
});

if (levelData) {
	level = Level.FromData(levelData);
} else {
	log.addMessage('No level detected. Generating...');
	level = new Level('server_level');
}

setInterval(() => {
	level.tick();
}, 1000 / Level.tickRate);

for (let type of ['projectile.fire', 'level.tick', 'player.death', 'entity.follow_path.start']) {
	level.addEventListener(type, async evt => {
		io.emit('event', type, evt.emitter, evt.data);
	});
}

io.use(async (socket, next) => {
	try {
		let clientData;
		try {
			clientData = await requestUserInfo('token', socket.handshake.auth.token);
		} catch (err) {
			log.addMessage(`Client auth API request failed: ` + err.stack, LogLevel.ERROR);
			next(new Error('invalid token'));
		}

		if (config.whitelist && !whitelist.includes(clientData.id)) {
			next(new Error('you are not whitelisted'));
		} else if (config.blacklist && blacklist.includes(clientData.id)) {
			next(new Error('you are banned from this server'));
		} else if (+clientData.disabled) {
			next(new Error('your account is disabled'));
		} else if (io.sockets.sockets.size >= config.max_clients && !(ops[clientData.id] && ops[clientData.id].bypassLimit)) {
			next(new Error('server full'));
		} else if (clients.getByID(clientData.id)) {
			next(new Error('already connected'));
		} else {
			let client = new Client(clientData.id, level, { socket, fleet: [] });
			client.name = clientData.username;
			clients.set(socket.id, client);
			log.addMessage(`${client.name} connected with socket id ${socket.id}`);
			io.emit('chat', `${client.name} joined`);
			next();
		}
	} catch (err) {
		log.addMessage('Client auth failed: ' + err.stack, LogLevel.ERROR);
		next(new Error('Server error'));
	}
});
io.on('connection', socket => {
	let client = clients.get(socket.id);
	io.emit(
		'playerlist',
		[...clients.values()].slice(0, 25).map(client => client.name)
	);
	socket.onAny(() => {
		client.sentPackets++;
	});
	socket.on('disconnect', reason => {
		let message = Client.GetDisconnectReason(reason);
		log.addMessage(`${client.name} left (${message})`);
		io.emit('chat', `${client.name} left`);
		clients.delete(socket.id);
		io.emit(
			'playerlist',
			[...clients.values()].slice(0, 25).map(client => client.name)
		);
	});
	socket.on('command', commandString => {
		const result = execCommandString(commandString, client);
		if (result) {
			socket.emit('chat', result);
		}
	});
	socket.on('chat', data => {
		log.addMessage(`[Chat] ${client.name}: ${data}`);
		io.emit('chat', `${client.name}: ${data}`);
	});
});

setInterval(() => {
	clients.forEach(client => {
		if (client.sentPackets > 50) {
			client.kick('Sending to many packets');
		}
		client.sentPackets = 0;
	});
}, 1000);

server.listen(config.port ?? 1123, () => log.addMessage('server started'));
