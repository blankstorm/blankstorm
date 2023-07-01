import path from 'node:path';
import * as fs from 'node:fs';
import pkg from '../package.json' assert { type: 'json' };

export function getVersionFromPackage() {
	let i = pkg.version.search(/alpha|beta/);
	i = i == -1 ? 0 : i;
	return pkg.version.slice(i);
}

export function renameOutput(renames: { [key: string]: string }, outPath = 'dist') {
	for (const [oldName, newName] of Object.entries(renames)) {
		const oldPath = path.join(outPath, oldName),
			newPath = path.join(outPath, newName);
		if (fs.existsSync(newPath)) {
			fs.rmSync(newPath, { recursive: true, force: true });
		}
		if (fs.existsSync(oldPath)) {
			fs.renameSync(oldPath, newPath);
		}
	}
}

export function deleteOutput(deletes: string[], outPath = 'dist') {
	for (const file of deletes) {
		fs.rmSync(path.join(outPath, file), { recursive: true, force: true });
	}
}
