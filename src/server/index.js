import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { version } from '../core/meta.js';

const logs = [];

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
			if (config.debug.public_uptime) data.uptime = process.uptime();
			res.end(JSON.stringify(data));
			break;
		case '/log':
			if (config.debug.public_log) {
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