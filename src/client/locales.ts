import EventEmitter from 'eventemitter3';
import $ from 'jquery';
import { isJSON } from 'utilium';
import { version } from '../core/metadata';
import * as settings from './settings';
import { logger } from './utils';

export interface Locale {
	language: string;
	name: string;
	version: string;
	text: Record<string, string>;
	markup_text: Record<string, string>;
}

const store: Map<string, Locale> = new Map();
export let currentLang: string = 'en';

const emitter: EventEmitter<{ fetch: Locale; load: Locale }> = new EventEmitter();
export const on = emitter.on.bind(emitter);

/**
 * Fetch and load a locale from a URL.
 *
 */
export async function load(url: string): Promise<Locale> {
	try {
		if (!settings.initialized) {
			throw 'Settings not initialized';
		}
		const locale: Locale = isJSON(url) ? JSON.parse(url) : await (await fetch(url)).json();
		if (typeof locale != 'object') throw 'Not an object';
		if (!locale.language) throw 'Does not have a language';
		if (!locale.version) throw 'Does not have a version';
		if (!locale?.text) throw 'Missing data';
		if (!version.match(locale.version)) throw 'Incompatible game version';

		store.set(locale.language, locale);
		logger.debug(`Loaded locale "${locale.name}" (${locale.language})`);
		settings.items.get('locale')!.addOption(locale.language, locale.name);
		emitter.emit('fetch', locale);
		return locale;
	} catch (e) {
		throw new Error(`Failed to load locale from ${url}: ${e}`);
	}
}

export function use(id: string) {
	const locale = store.get(id);
	if (!locale) {
		throw new Error(`Locale ${id} does not exist`);
	}
	currentLang = id;
	for (const [selector, text] of Object.entries(locale.markup_text)) {
		$(selector).filter('[locale]').text(text);
	}
	for (const [id, section] of settings.sections) {
		const _ = text('settings_section', id);
		section.ui.find('h2.settings-name').text('Settings - ' + _);
		section.button.find('span').text(_);
	}
	logger.debug(`Using locale "${locale.name}" (${locale.language})`);
	emitter.emit('load', locale);
}

export function text(...keyParts: string[]): string {
	return store.get(currentLang)?.text?.[keyParts.join('.')] || 'Unknown';
}

export const has = (lang: string): boolean => store.has(lang);

export function loaded() {
	return [...store.keys()];
}

export async function init(): Promise<void> {
	if (!settings.initialized) {
		throw new Error('Settings not initialized');
	}
	for (const locale of ['en']) {
		await load(`locales/${locale}.json`);
	}
	use('en');
	const selected: string = settings.get('locale');
	if (has(selected) && selected != 'en') {
		use(selected);
	}
}
