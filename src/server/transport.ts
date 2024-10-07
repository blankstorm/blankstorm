import type { Server as HTTPServer } from 'node:http';
import { createServer } from 'node:http';
import type { ListenOptions } from 'node:net';
import { Server as SocketIOServer } from 'socket.io';
import type { VersionID } from '../core/metadata';
import { currentVersion } from '../core/metadata';
import { config } from './config';
import { logger } from './utils';

export interface PingInfo {
	current_clients: number;
	max_clients: number;
	message: string;
	version: VersionID;
	uptime?: number;
}

export const http: HTTPServer = createServer((req, res) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	switch (req.url) {
		case '/ping':
			const data: PingInfo = {
				current_clients: io.sockets.sockets.size,
				max_clients: config.max_clients,
				message: config.message,
				version: currentVersion,
			};
			if (config.public_uptime) data.uptime = process.uptime();
			res.end(JSON.stringify(data));
			break;
		case '/log':
			if (config.public_log) {
				res.end(logger.toString());
			} else {
				res.statusCode = 403;
				res.end('Log is not public.');
			}
			break;
	}
});

export const io = new SocketIOServer(http, {
	pingInterval: 1000,
	pingTimeout: 10000,
}).attach(http);

export function listen(options: ListenOptions): Promise<void> {
	return new Promise<void>(resolve => http.listen(options, resolve));
}
