import path from 'node:path';
import * as fs from 'node:fs';
import pkg from '../package.json' assert { type: 'json' };

export interface VersionInfo {
	version: string;
	subversion: string;
	type?: 'indev' | 'alpha' | 'beta' | 'prerelease' | 'release' | string;
	display: string;
	electronBuilder: {
		version: string;
		shortVersion: string;
		shortVersionWindows: string;
	};
}
export function getVersionInfo(): VersionInfo {
	const { groups: match } = /^(?<version>\d+(?:\.\d+)*)(?:[-_](?<type>\w+)[-_](?<subversion>\d*(?:\.\d+)*))?/.exec(pkg.version);
	const shortVersion = match.type ? match.version : '0.' + match.version;
	return {
		version: match.version,
		subversion: match.subversion,
		type: match.type,
		display: ['alpha', 'beta'].includes(match.type) ? `${match.type}-${match.subversion}` : match.version,
		electronBuilder: {
			version: pkg.version,
			shortVersion,
			shortVersionWindows: shortVersion,
		},
	};
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
