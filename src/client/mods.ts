import { isJSON } from 'utilium';
import { path } from './config';
import { logger } from './utils';
const fs = $app.require('fs');

interface ModData {
	id: string;
	version: string;
}

class Mod {}

const mods: Map<string, Mod> = new Map();
export const size = mods.size;
export const ids: typeof mods.keys = mods.keys.bind(mods);

export function load(data: ModData): void {
	logger.debug('Loaded mod: ' + data.id);
}

export function init(): void {
	const folderPath = path + '/mods';
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath);
	}
	for (const filename of fs.readdirSync(folderPath)) {
		if (!filename.endsWith('.json')) {
			continue;
		}
		const contents: string = fs.readFileSync(path + '/mods/' + filename, 'utf8');
		if (!isJSON(contents)) {
			continue;
		}
		const data: ModData = JSON.parse(contents);
		load(data);
	}
	logger.info(`Loaded ${mods.size} mods`);
}
