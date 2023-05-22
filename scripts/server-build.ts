import { build } from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { exec as pkg } from 'pkg';
import { version as rawVersion } from '../src/core/meta';

const version = (rawVersion as string).replaceAll('_', '-');
const outfile = 'dist/tmp/server.js';

await build({
	entryPoints: ['src/server/index.ts'],
	bundle: true,
	outfile,
	platform: 'node',
	keepNames: true,
});

await pkg([outfile, '--output', 'dist/server', '--target', 'latest-win,latest-linux,latest-macos']);

const renames = new Map([
	[`server-win.exe`, `blankstorm-server-${version}.exe`],
	[`server-macos`, `blankstorm-server-${version}-macos`],
	[`server-linux`, `blankstorm-server-${version}-linux`],
]);

for (let [oldName, newName] of renames) {
	const oldPath = path.join('dist', oldName),
		newPath = path.join('dist', newName);
	if (fs.existsSync(oldPath)) {
		fs.renameSync(oldPath, newPath);
	}
}
