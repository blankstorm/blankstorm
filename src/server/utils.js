import * as fs from 'fs';
import { isJSON } from '../core/utils.js';

export function readJSONFile(path) {
	if (!fs.existsSync(path)) {
		return false;
	}

	const content = fs.readFileSync(path);

	if (!isJSON(content)) {
		return false;
	}

	return JSON.parse(content);
}
