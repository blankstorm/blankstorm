import * as fs from 'fs';
import { Logger } from 'logzen';
import { isJSON } from 'utilium';

export const logger = new Logger({ hideWarningStack: true });

export function readJSONFile<T extends object = object>(path: string): T | undefined {
	if (!fs.existsSync(path)) {
		return;
	}

	const content = fs.readFileSync(path, { encoding: 'utf8' });

	if (!isJSON(content)) {
		return;
	}

	return JSON.parse(content);
}
