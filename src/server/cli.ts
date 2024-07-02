import path from 'node:path';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import { config as coreConfig } from '../core/metadata';
import { readJSONFile } from './utils';
import { Logger } from 'logzen';
import { Server } from './Server';
import type { ServerOptions } from './Server';

const log = new Logger();

//load config and settings and things
export const options: ServerOptions = {
	config: {
		whitelist: false,
		blacklist: true,
		max_clients: 10,
		message: '',
		debug: false,
		public_log: false,
		public_uptime: false,
		port: coreConfig.default_port,
	},
};

for (const [name, filePath] of Object.entries({
	config: 'config.json',
	ops: 'ops.json',
	whitelist: 'whitelist.json',
	blacklist: 'blacklist.json',
	levelData: 'level.json',
})) {
	const data = readJSONFile(filePath);
	if (data) {
		Object.assign(options[name], data);
	} else {
		log.warn(`Failed to load ${name} from ${path.resolve(filePath)}`);
	}
}

const server = new Server(options);
server.on('whitelist.update', () => {
	fs.writeFileSync('whitelist.json', JSON.stringify(server.whitelist));
});
server.on('blacklist.update', () => {
	fs.writeFileSync('blacklist.json', JSON.stringify(server.blacklist));
});
server.on('ops.update', () => {
	fs.writeFileSync('ops.json', JSON.stringify(server.ops));
});
server.on('save', () => {
	fs.writeFileSync('level.json', JSON.stringify(server.level.toJSON()));
});
server.on('stop', () => {
	process.exit();
});
server.on('restart', () => {
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
});
server.listen(options.config.port || coreConfig.default_port).then(() => log.log('server started'));
process.on('uncaughtException', err => {
	log.error('Fatal error: ' + err.stack);
	server.stop();
});
process.on('warning', warning => {
	log.warn(warning.name);
});
process.once('SIGINT', () => server.stop()).once('SIGTERM', () => server.stop());
