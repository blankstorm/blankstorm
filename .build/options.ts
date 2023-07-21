import { readFileSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

export interface BuildOptions {
	debug_mode: boolean;
	asset_dir: string;
}

export type Mode = 'dev' | 'development' | 'prod' | 'production';

function resolveOptionsPath(mode: Mode | string) {
	switch (mode) {
		case 'dev':
		case 'development':
			return 'dev.json';
		case 'prod':
		case 'production':
			return 'prod.json';
		default:
			throw `Invalid build mode: "${mode}"`;
	}
}

export function getOptions(mode: Mode | string): BuildOptions {
	const optionsPath = resolveOptionsPath(mode);
	return JSON.parse(readFileSync(path.resolve(fileURLToPath(import.meta.url), '..', optionsPath), { encoding: 'utf8' }));
}

function resolveReplacement(value) {
	if (value === null || typeof value !== 'object') {
		return JSON.stringify(value);
	}

	return Object.entries(value).flatMap(([key, value]) => {
		const replacement = resolveReplacement(value);

		if (!Array.isArray(replacement)) {
			return [[key, replacement]];
		}

		const entries = replacement.map(([nestedKey, nestedValue]) => [`${key}.${nestedKey}`, nestedValue]);

		entries.push([key, JSON.stringify(value)]);

		return entries;
	});
}

export function getReplacements(options: BuildOptions): { [key: string]: string } {
	const replacements = Object.fromEntries(resolveReplacement({ _build: options }));

	for (const key in replacements) {
		if (/".*"/.test(replacements[key])) {
			replacements[key] = replacements[key].slice(1, -1);
		}
	}

	return replacements;
}
