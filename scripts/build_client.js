import * as fs from 'fs';
import path from 'path';
import { version as pkgVersion } from '../package.json' assert { type: 'json' };
import { version as rawVersion } from '../src/core/meta.js';

const version = rawVersion.replaceAll('_', '-');

const renames = new Map([
	[`Blankstorm Client Setup ${pkgVersion}.exe`, `client-windows-${version}.exe`],
	[`Blankstorm Client-${pkgVersion}.AppImage`, `client-macos-${version}.AppImage`],
	[`blankstorm-client_${pkgVersion}_amd64.snap`, `client-linux-${version}.snap`],
]);

for(let [oldName, newName] of renames){
	const oldPath = path.join('dist', oldName),
	newPath = path.join('dist', newName);
	if(fs.existsSync(oldPath)){
		fs.renameSync(oldPath, newPath);
	}
}