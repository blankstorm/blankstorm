import * as fs from 'fs';
import path from 'path';
import pkg from '../package.json' assert { type: 'json' };
import { version as rawVersion } from '../src/core/meta.js';

const version = rawVersion.replaceAll('_', '-');

const renames = [
	[`Blankstorm Client Setup ${pkg.version}.exe`, `client-win-${version}.exe`],
	[`Blankstorm Client Setup ${pkg.version}.exe.blockmap`, `client-win-${version}.exe.blockmap`],
	[`Blankstorm Client-${pkg.version}.AppImage`, `client-macos-${version}.AppImage`],
	[`blankstorm-client_${pkg.version}_amd64.snap`, `client-linux-${version}.snap`],
];

const deletes = ['builder-debug.yml', 'builder-effective-config.yaml', 'latest.yml', '.icon-ico'];

for (let [oldName, newName] of renames) {
	const oldPath = path.join('dist', oldName),
		newPath = path.join('dist', newName);
	if (fs.existsSync(oldPath)) {
		fs.renameSync(oldPath, newPath);
	}
}

for (let file of deletes) {
	fs.rmSync(path.join('dist', file), { recursive: true, force: true });
}
