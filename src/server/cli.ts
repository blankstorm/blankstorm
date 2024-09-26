import * as path from 'node:path';
import { List } from 'utilium';
import type { LevelJSON } from '../core/level';
import { config as coreConfig } from '../core/metadata';
import { blacklist, config, ops, whitelist, type OpsEntry, type ServerConfig } from './config';
import { stop } from './server';
import { listen } from './transport';
import { logger, readJSONFile } from './utils';

const levelData: LevelJSON | Record<string, never> = {};

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

void listen({ port: config.port || coreConfig.default_port }).then(() => logger.log('server started'));
process
	.on('uncaughtException', err => {
		logger.error('Fatal error: ' + err.stack);
		stop();
	})
	.on('warning', warning => logger.warn(warning.name))
	.once('SIGINT', () => stop())
	.once('SIGTERM', () => stop());
