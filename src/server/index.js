import path from 'path';
import * as fs from 'fs';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { version } from '../core/meta.js';
import { Command, commands, execCommandString } from '../core/commands.js';
import { requestUserInfo } from '../core/api.js';

import { readJSONFile } from './utils.js';
import { Log, LogLevel } from './Log.js';
import Client from './Client.js';

const log = new Log();

const clients = new Map();
commands.set(
	'kick',
	new Command((player, ...reason) => {
		clients.getByName(player).kick(reason);
		log.addMessage(`${this.executor.username} kicked ${player}. Reason: ${reason.join(' ')}`);
		return 'Kicked ' + player;
	}, 3)
);
commands.set(
	'ban',
	new Command((player, ...reason) => {
		clients.getByName(player).ban(reason);
		log.addMessage(`${this.executor.username} banned ${player}. Reason: ${reason.join(' ')}`);
		return 'Banned ' + player;
	}, 4)
);
commands.set(
	'unban',
	new Command((player, ...reason) => {
		Client.GetID(player).then(id => {
			blacklist.splice(blacklist.indexOf(id), 1);
			fs.writeFileSync('./blacklist.json', JSON.stringify(blacklist));
			log.addMessage(`${this.executor.username} unbanned ${player}. Reason: ${reason.join(' ')}`);
		});
	}, 4)
);
commands.set(
	'log',
	new Command((...message) => {
		log.addMessage(`${this.executor.username} logged ${message.join(' ')}`);
	}, 1)
);
commands.set(
	'msg',
	new Command((player, ...message) => {
		if (clients.getByName(player) instanceof Client) {
			clients.getByName(player).socket.emit(`[${this.executor.username} -> me] ${message.join(' ')}`);
			log.addMessage(`[${this.executor.username} -> ${player}] ${message.join(' ')}`);
			clients.getByName(player).lastMessager = this.executor;
			return `[me -> ${this.executor.username}] ${message.join(' ')}`;
		} else {
			return 'That user is not online';
		}
	}, 0)
);
commands.set(
	'reply',
	new Command((...message) => {
		return this.executor.lastMessager ? commands.msg.run(this.executor, [this.executor.lastMessager.username, ...message]) : 'No one messaged you yet =(';
	}, 0)
);
commands.set(
	'stop',
	new Command((...message) => {
		for (let client of clients.values()) {
			client.kick('Server shutting down');
		}
		process.exit();
	}, 4)
);
commands.set(
	'restart',
	new Command((...message) => {
		for (let client of clients.values()) {
			client.kick('Server restarting');
		}
		setTimeout(e => {
			process.on('exit', function () {
				require('child_process').spawn(process.argv.shift(), process.argv, {
					cwd: process.cwd(),
					detached: true,
					stdio: 'inherit',
				});
			});
			process.exit();
		}, 1000);
	}, 4)
);

//load config and settings and things
let config = {
		whitelist: false,
		blacklist: true,
		max_clients: 10,
		message: '',
		log_verbose: false,
		debug: {
			public_uptime: true,
			public_log: true,
		},
	},
	ops = {},
	whitelist = {},
	blacklist = {};

for (let [name, filePath] of Object.entries({
	config: 'config.json',
	ops: 'ops.json',
	whitelist: 'whitelist.json',
	blacklist: 'blacklist.json',
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
				res.end('Log is not public.');
			}
			break;
	}
});

const io = new SocketIOServer(server, {
	pingInterval: 1000,
	pingTimeout: 10000,
	cors: { origin: config.allow_from_all ? '*' : 'https://blankstorm.drvortex.dev' },
});

io.use(async (socket, next) => {
	try {
		const clientData = await requestUserInfo('token', socket.handshake.auth.token);

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
			let client = new Client(clientData.id, null, { socket });
			clients.set(socket.id, client);
			log.addMessage(`${clientData.username} connected with socket id ${socket.id}`);
			io.emit('chat', `${clientData.username} joined`);
			next();
		}
	} catch (err) {
		next(new Error('invalid token'));
	}
});
io.on('connection', socket => {
	let client = clients.get(socket.id);
	io.emit(
		'playerlist',
		[...clients.values()].slice(0, 25).map(data => data.username)
	);
	socket.onAny(eventName => {
		client.sentPackets++;
	});
	socket.on('disconnect', reason => {
		let message = Client.GetDisconnectReason(reason);
		log.addMessage(`${client.username} left (${message})`);
		io.emit('chat', `${client.username} left`);
		clients.delete(socket.id);
		io.emit(
			'playerlist',
			[...clients.values()].slice(0, 25).map(data => data.username)
		);
	});
	socket.on('command', commandString => {
		execCommandString(commandString, client);
	});
	socket.on('chat', data => {
		log.addMessage(`[Chat] ${client.username}: ${data}`);
		io.emit('chat', `${client.username}: ${data}`);
	});
});

setInterval(e => {
	clients.forEach(client => {
		if (client.sentPackets > 50) {
			client.kick('Sending to many packets');
		}
		client.sentPackets = 0;
	});
}, 1000);

server.listen(config.port ?? 1123, () => log.addMessage('server started'));
