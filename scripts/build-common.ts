import { listTags, log, readTag, resolveRef } from 'isomorphic-git';
import * as fs from 'node:fs';
import path from 'node:path';
import { gitCommitHash } from 'utilium/fs.js';
import { parse, type Full } from 'utilium/version.js';
import $package from '../package.json' assert { type: 'json' };

async function getLatestTag(): Promise<string | null> {
	const tags = new Map<string, string[]>();

	// Map each commit SHA to its associated tags
	for (const tag of await listTags({ fs, dir: '.' })) {
		const oid = await resolveRef({ fs, dir: '.', ref: tag });

		let commitSha = oid;
		try {
			// Handle annotated tags
			const tagObject = await readTag({ fs, dir: '.', oid });
			commitSha = tagObject.tag.object;
		} catch {
			// Handle lightweight tags (no action needed)
		}

		if (!tags.has(commitSha)) {
			tags.set(commitSha, []);
		}
		tags.get(commitSha)!.push(tag);
	}

	// Traverse commits from HEAD
	const commits = await log({ fs, dir: '.', depth: 100 });
	for (const commit of commits) {
		const commitSha = commit.oid;
		if (tags.has(commitSha)) {
			// Return the first tag found for this commit
			return tags.get(commitSha)![0];
		}
	}

	// No tag found in the recent commit history
	return null;
}

const latestTag = await getLatestTag();

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

export function defines(mode: string): Record<'$debug' | '$revision' | '$tag', string> {
	return {
		$debug: JSON.stringify(mode == 'dev' || mode == 'development'),
		$revision: JSON.stringify(gitCommitHash()),
		$tag: JSON.stringify(latestTag),
	};
}
