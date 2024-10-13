import $ from 'jquery';
import { Logger } from 'logzen';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PlanetBiome } from '../core/generic/planets';

const __formatter = Intl.NumberFormat('en', { notation: 'compact' });

export const minimize = __formatter.format.bind(__formatter);

export function fixPaths(text: string): string {
	return text.replaceAll(/file:\/\/\/[A-Za-z0-9+&@#/%?=~_|!:,.;-]*[-A-Za-z0-9+&@#/%=~_|]/g, match =>
		fileURLToPath(match)
			.replace(path.resolve(fileURLToPath(import.meta.url), '..', '..', '..'), '')
			.replaceAll('\\', '/')
	);
}

export function biomeColor(biome: PlanetBiome): string {
	switch (biome) {
		case 'earthlike':
		case 'jungle':
			return '#cdb';
		case 'islands':
			return '#cde';
		case 'volcanic':
			return '#dbb';
		case 'desert':
			return '#dcb';
		case 'ice':
			return '#cee';
		case 'moon':
			return '#bbb';
	}
}

export function $svg<TElement extends SVGElement>(tag: string): JQuery<TElement> {
	const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
	return $<TElement>(element as TElement);
}

export function optionsOf(error: unknown): ErrorOptions {
	return { cause: error instanceof Error ? error.stack : error + '' };
}

export const logger = new Logger({ prefix: 'client', hideWarningStack: true });
logger.on('send', $app.log);
