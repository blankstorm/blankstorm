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
	text: { [key: string]: string };
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
	$('#main button.sp').text(locale.text['menu.singleplayer'] ?? 'Singleplayer');
	$('#main button.mp').text(locale.text['menu.multiplayer'] ?? 'Multiplayer');
	$('#main button.options,#pause button.options').text(locale.text['menu.options'] ?? 'Options');
	$('#main button.exit').text(locale.text['menu.exit'] ?? 'Exit');
	$('#pause button.resume').text(locale.text['menu.resume'] ?? 'Resume Game');
	$('#pause button.save').text(locale.text['menu.save_game'] ?? 'Save Game');
	$('#pause button.quit').text(locale.text['menu.quit'] ?? 'Main Menu');
	$('#saves button.upload span').text(locale.text['menu.upload'] ?? 'Upload');
	$('#server-list button.refresh span').text(locale.text['menu.refresh'] ?? 'Refresh');
	$(':where(#saves,#server-list,#save-new,#settings,#waypoint-list) button.back span').text(locale.text['menu.back'] ?? 'Back');
	$(':where(#saves,#server-list,#ingame-temp-menu,#waypoint-list) button.new span').text(locale.text['menu.new'] ?? 'New');
	$('#save-new button.new span').text(locale.text['menu.start'] ?? 'Start');
	$(':where(#confirm,#login,#save-edit,#server-dialog) .cancel').text(locale.text['menu.cancel'] ?? 'Cancel');
	$(':where(#save-edit,#server-dialog,#waypoint-dialog) .save').text(locale.text['menu.save'] ?? 'Save');
	$('#connect button.back span,#waypoint-dialog .cancel').text(locale.text['menu.cancel'] ?? 'Cancel');
	$('#map button.waypoints span').text(locale.text['menu.waypoints'] ?? 'Waypoints');
	$('#ingame-temp-menu div.nav button[section=inventory] span').text(locale.text['menu.items'] ?? 'Inventory');
	$('#ingame-temp-menu div.nav button[section=screenshots] span').text(locale.text['menu.screenshots'] ?? 'Screenshots');
	$('#ingame-temp-menu div.nav button[section=shipyard] span').text(locale.text['menu.shipyard'] ?? 'Shipyard');
	$('#ingame-temp-menu div.nav button[section=lab] span').text(locale.text['menu.lab'] ?? 'Laboratory');
	for (const [id, section] of settings.sections) {
		section.label = () => text('menu.settings_section.' + id);
		$(`#settings-nav button[section=${id}] span`).text(locale.text['menu.settings_section.' + id]);
	}
	logger.debug(`Using locale "${locale.name}" (${locale.language})`);
	emitter.emit('load', locale);
}

export function text(key: string | TemplateStringsArray): string {
	return store.get(currentLang)?.text?.[typeof key == 'string' ? key : key[0]] || 'Unknown';
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
