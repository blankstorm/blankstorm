import $ from 'jquery';
import { isJSON } from 'utilium';
import { currentVersion } from '../core/metadata';
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

/**
 * Fetch and load a locale from a URL.
 *
 */
export async function load(url: string): Promise<Locale> {
	if (!settings.initialized) {
		throw new Error('Settings not initialized');
	}
	const locale: Locale = isJSON(url) ? JSON.parse(url) : await (await fetch(url)).json();
	if (typeof locale != 'object') throw 'Not an object';
	if (!locale.language) throw 'Does not have a language';
	if (!locale.version) throw 'Does not have a version';
	if (!locale?.text) throw 'Missing data';
	if (!currentVersion.match(locale.version)) throw 'Incompatible game version';

	store.set(locale.language, locale);
	logger.debug(`Loaded locale "${locale.name}" (${locale.language})`);
	settings.items.get('locale')!.addOption(locale.language, locale.name);
	return locale;
}

export function use(id: string) {
	const locale = store.get(id);
	if (!locale) {
		throw new Error('Locale does not exist: ' + id);
	}
	currentLang = id;
	for (const [selector, text] of Object.entries(locale.markup_text)) {
		if (!text || /^\s*$/.test(text)) {
			logger.warn('Empty or whitespace-only locale text: ' + selector);
		}
		$(selector).filter('[locale]').text(text);
	}
	for (const [id, section] of settings.sections) {
		const label = text('settings_section', id);
		section.ui.find('h2.settings-name').text(text('settings') + ' - ' + label);
		section.button.find('span').text(label);
	}
	settings.updateUI();
	logger.debug(`Using locale "${locale.name}" (${locale.language})`);
}

export function text(...keyParts: string[]): string {
	return store.get(currentLang)?.text?.[keyParts.join('.')] || 'Unknown';
}

/**
 * Gets the text for a selector
 */
export function textFor(selector: string): string {
	return store.get(currentLang)?.markup_text[selector] || 'Unknown';
}

export function hasText(...keyParts: string[]): boolean {
	return Object.hasOwn(store.get(currentLang)?.text || {}, keyParts.join('.'));
}

export const has = (lang: string): boolean => store.has(lang);

export function loaded() {
	return [...store.keys()];
}

export async function init(): Promise<void> {
	if (!settings.initialized) {
		throw new Error('Settings not initialized');
	}
	for (const locale of ['en', 'nl']) {
		await load(`locales/${locale}.json`);
	}
	use('en');
	const selected: string = settings.get('locale');
	if (has(selected) && selected != 'en') {
		use(selected);
	}
	settings.items.get('locale')!.value = selected || 'en';
}
