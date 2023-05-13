import path from 'node:path';
import { spawn } from 'node:child_process';
import * as fs from 'node:fs';
import { config as coreConfig } from '../core/meta.js';
import { readJSONFile } from './utils.js';
import { Log, LogLevel } from './Log.js';
import Server from './Server.js';

const log = new Log();

//load config and settings and things
export const options = {
	config: {
		whitelist: false,
		blacklist: true,
		max_clients: 10,
		message: '',
		log_verbose: false,
		debug_mode: false,
	},
};

for (let [name, filePath] of Object.entries({
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
		log.addMessage(`Failed to load ${name} from ${path.resolve(filePath)}`, LogLevel.WARN);
	}
}

const server = new Server(options);
server.on('update_whitelist', () => {
	fs.writeFileSync('whitelist.json', JSON.stringify(server.whitelist));
});
server.on('update_blacklist', () => {
	fs.writeFileSync('blacklist.json', JSON.stringify(server.blacklist));
});
server.on('update_ops', () => {
	fs.writeFileSync('ops.json', JSON.stringify(server.ops));
});
server.on('save', () => {
	fs.writeFileSync('level.json', JSON.stringify(server.level.serialize()));
});
server.on('stop', () => {
	process.exit();
})
server.on('restart', () => {
	setTimeout(() => {
		process.on('exit', () => {
			spawn(process.argv.shift(), process.argv, {
				cwd: process.cwd(),
				detached: true,
				stdio: 'inherit',
			});
		});
	}, 1000);
	process.exit();
});
server.listen(options.config.port || coreConfig.default_port, () => log.addMessage('server started'));
process.on('uncaughtException', (err) => {
	log.addMessage('Fatal error: ' + err.stack, LogLevel.ERROR);
	server.stop(LogLevel.ERROR);
});
process.on('warning', (warning) => {
	log.addMessage(warning.name, LogLevel.WARN);
});
process.once('SIGINT', () => server.stop()).once('SIGTERM', () => server.stop());
