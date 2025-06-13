import { execCommandString } from 'deltablank/core/commands.js';
import 'deltablank/server/commands.js';
import { blacklist, config, ops, whitelist, type OpsEntry, type ServerConfig } from 'deltablank/server/config.js';
import { onClose, stop } from 'deltablank/server/server.js';
import { listen } from 'deltablank/server/transport.js';
import { logger, readJSONFile } from 'deltablank/server/utils.js';
import * as path from 'node:path';
import { createInterface } from 'node:readline';
import { styleText } from 'node:util';
import { List } from 'utilium';
import '../core/commands.js';
import '../core/components/index.js';
import '../core/entities/index.js';
import type { BS_LevelJSON } from '../core/level.js';
import { config as coreConfig } from '../core/metadata.js';

const levelData: BS_LevelJSON | Record<string, never> = {};

//load config and settings and things

for (const [data, filePath] of [
	[config, 'options.json'],
	[ops, 'ops.json'],
	[whitelist, 'whitelist.json'],
	[blacklist, 'blacklist.json'],
	[levelData, 'level.json'],
] as const) {
	const contents = readJSONFile<(OpsEntry[] & string[]) | ServerConfig>(filePath);
	if (!contents) {
		logger.warn('Failed to load ' + path.resolve(filePath));
		continue;
	}

	if (!(data instanceof List)) {
		Object.assign(data, contents);
		continue;
	}

	if (!Array.isArray(contents)) {
		throw new TypeError('Invalid data in ' + path.resolve(filePath));
	}

	if (typeof data.at(0) != typeof contents[0]) {
		throw new TypeError('Invalid data in ' + path.resolve(filePath));
	}

	data.push(...contents);
}

void listen({ port: config.port || coreConfig.default_port }).then(() => logger.info('server started'));

const input = createInterface(process.stdin, process.stdout);

input.on('line', line => {
	const result = execCommandString(line, { executor: {} as any }, true);
	if (result) console.log(styleText('blue', result));
});

onClose(() => {
	input.close();
});

process
	.on('uncaughtException', err => {
		logger.error('Fatal error: ' + err.stack);
		stop();
	})
	.on('warning', warning => logger.warn(warning.name))
	.once('SIGINT', stop)
	.once('SIGTERM', stop);

input.resume();

input.on('close', stop);
