import path from 'node:path';
import * as fs from 'node:fs';
import $package from '../package.json' assert { type: 'json' };

export interface VersionInfo {
	fullVersion: string;
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

export function getVersionInfo(fullVersion: string = $package.version): VersionInfo {
	const { type, subversion, version } = /^(?<version>\d+(?:\.\d+)*)(?:[-_](?<type>\w+)[-_](?<subversion>\d*(?:\.\d+)*))?/.exec(fullVersion)!.groups!;
	const shortVersion = type ? '0.' + subversion : version + '.0';
	return {
		fullVersion,
		version,
		subversion,
		type,
		display: ['alpha', 'beta'].includes(type) ? `${type}-${subversion}` : version,
		electronBuilder: {
			version: $package.version,
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

export function defines(mode: string): {
	$debug: string;
	$package: string;
} {
	return {
		$debug: JSON.stringify(mode == 'dev' || mode == 'development'),
		$package: JSON.stringify($package),
	};
}
