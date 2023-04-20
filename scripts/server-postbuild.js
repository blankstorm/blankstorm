import * as fs from 'fs';
import path from 'path';
import { version as rawVersion } from '../src/core/meta.js';

const version = rawVersion.replaceAll('_', '-');

const renames = new Map([
	[`server-win.exe`, `server-win-${version}.exe`],
	[`server-macos`, `server-macos-${version}`],
	[`server-linux`, `server-linux-${version}`],
]);

for (let [oldName, newName] of renames) {
	const oldPath = path.join('dist', oldName),
		newPath = path.join('dist', newName);
	if (fs.existsSync(oldPath)) {
		fs.renameSync(oldPath, newPath);
	}
}
