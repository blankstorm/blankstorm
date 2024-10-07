import * as fs from 'node:fs';
import path from 'node:path';
import { gitCommitHash } from 'utilium/fs.js';
import { parse, type Full } from 'utilium/version.js';
import $package from '../package.json' assert { type: 'json' };

export const version = parse($package.version as Full, true);

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

export function defines(mode: string): Record<'$debug' | '$revision', string> {
	return {
		$debug: JSON.stringify(mode == 'dev' || mode == 'development'),
		$revision: JSON.stringify(gitCommitHash()),
	};
}
