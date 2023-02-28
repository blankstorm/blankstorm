import path from 'path';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import { version } from '../core/meta.js';
import { execCommandString } from '../core/commands.js';
import { requestUserInfo } from '../core/api.js';

import { readJSONFile } from './utils.js';
import { Log, LogEntry, LogLevel } from './Log.js';
import Client from './Client.js';

const logs = [], clients = new Map();

//load config and settings and things
let config = {}, ops = {}, whitelist = [], blacklist = [];

for(let [name, filePath] of {
	config: 'config.json',
	ops: 'ops.json',
	whitelist: 'whitelist.json',
	blacklist: 'blacklist.json',
}){
	const data = readJSONFile(filePath);
	if(data){
		globalThis[name] = data;
	}else{
		console.log(`Warning: Failed to load "${name}" from ${path.resolve(filePath)}`);
	}
}

const log = (...msg) => {
	console.log(`[${performance.now()}] ${msg}`);

}

const server = createServer((req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	switch (req.url) {
		case '/ping':
			let data = {
				currentPlayers: io.sockets.sockets.size,
				maxPlayers: config.max_players,
				message: config.message,
				version,
			};
			if (config.debug?.public_uptime) data.uptime = process.uptime();
			res.end(JSON.stringify(data));
			break;
		case '/log':
			if (config.debug?.public_log) {
				let _log = logs.join('\n');
				res.end(_log);
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
			next(new Error('Connection refused: you are not whitelisted'));
		} else if (config.blacklist && blacklist.includes(clientData.id)) {
			next(new Error('Connection refused: you are banned from this server'));
		} else if (+clientData.disabled) {
			next(new Error('Connection refused: your account is disabled'));
		} else if (io.sockets.sockets.size >= config.max_players && !(ops[clientData.id] && ops[clientData.id].bypassLimit)) {
			next(new Error('Connection refused: server full'));
		} else if (clients.getByID(clientData.id)) {
			next(new Error('Connection refused: already connected'));
		} else {
			let client = new Client(clientData.id, null, { socket });
			log(`${clientData.username} connected with socket id ${socket.id}`);
			io.emit('chat', `${clientData.username} joined`);
			next();
		}
	} catch (err) {
		next(new Error('Connection refused: invalid token'));
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
		let message =
			reason == 'server namespace disconnect'
				? 'Disconnected by server'
				: reason == 'client namespace disconnect'
				? 'Client disconnected'
				: reason == 'ping timeout'
				? 'Connection timed out'
				: reason == 'transport close'
				? 'Lost Connection'
				: reason == 'transport error'
				? 'Connection failed'
				: reason;
		log(`${client.username} left (${message})`);
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
		log(`[Chat] ${client.username}: ${data}`);
		io.emit('chat', `${client.username}: ${data}`);
	});
});

setInterval(e => {
	clients.forEach(player => {
		if (player.sentPackets > 50) {
			player.kick('Sending to many packets');
		}
		player.sentPackets = 0;
	});
}, 1000);

server.listen(config.port ?? 1123, e => log('server started'));
