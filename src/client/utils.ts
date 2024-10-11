import $ from 'jquery';
import { Logger } from 'logzen';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PlanetBiome } from '../core/generic/planets';

export function upload(type: string, multiple = false): Promise<File> {
	return new Promise<File>((resolve, reject) => {
		$<HTMLInputElement>(`<input type=file ${type ? `accept='${type}'` : ''} ${multiple ? 'multiple' : ''}>`)
			.on('change', e => {
				const file = e.target?.files?.[0];
				file ? resolve(file) : reject(new ReferenceError('No files uploaded'));
			})
			.trigger('click');
	});
}

export function download(data: BlobPart, name: string): void {
	$(`<a href=${URL.createObjectURL(new Blob([data]))} download="${name ?? 'download'}"></a>`)[0].click();
}

const __formatter = Intl.NumberFormat('en', { notation: 'compact' });

export const minimize = __formatter.format.bind(__formatter);

export function fixPaths(text: string): string {
	return text.replaceAll(/file:\/\/\/[A-Za-z0-9+&@#/%?=~_|!:,.;-]*[-A-Za-z0-9+&@#/%=~_|]/g, match =>
		fileURLToPath(match)
			.replace(path.resolve(fileURLToPath(import.meta.url), '..', '..', '..'), '')
			.replaceAll('\\', '/')
	);
}

export function getByString(object: Record<string, any>, path: string, separator = /[.[\]'"]/) {
	return path
		.split(separator)
		.filter(p => p)
		.reduce((o, p) => o?.[p], object);
}

export function setByString(object: Record<string, any>, path: string, value: unknown, separator = /[.[\]'"]/) {
	return path
		.split(separator)
		.filter(p => p)
		.reduce((o, p, i) => (o[p] = path.split(separator).filter(p => p).length === ++i ? value : o[p] || {}), object);
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
