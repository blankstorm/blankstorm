import { isJSON } from '../core/utils';
import { version } from '../core/metadata';
import * as settings from './settings';
import $ from 'jquery';
import EventEmitter from 'eventemitter3';

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
 * @todo fix circular dependency
 */
export async function fetch(url: string) {
	try {
		const locale: Locale = isJSON(url) ? JSON.parse(url) : await $.ajax(url);
		if (typeof locale != 'object') throw 'Not an object';
		if (!locale.language) throw 'Does not have a language';
		if (!locale.version) throw 'Does not have a version';
		if (!locale?.text) throw 'Missing data';
		if (!version.match(locale.version)) throw 'Incompatible game version';

		store.set(locale.language, locale);
		emitter.emit('fetch', locale);
		return locale;
	} catch (e) {
		throw new Error(`Failed to load locale from ${url}: ${e}`);
	}
}

export function load(id: string) {
	if (!store.has(id)) throw new Error(`Locale ${id} does not exist`);
	const lang = store.get(id);
	currentLang = id;
	$('#main button.sp').text(lang['menu.singleplayer'] ?? 'Singleplayer');
	$('#main button.mp').text(lang['menu.multiplayer'] ?? 'Multiplayer');
	$('#main button.options,#pause button.options').text(lang['menu.options'] ?? 'Options');
	$('#main button.exit').text(lang['menu.exit'] ?? 'Exit');
	$('#pause button.resume').text(lang['menu.resume'] ?? 'Resume Game');
	$('#pause button.save').text(lang['menu.save_game'] ?? 'Save Game');
	$('#pause button.quit').text(lang['menu.quit'] ?? 'Main Menu');
	$('#save-list button.upload span').text(lang['menu.upload'] ?? 'Upload');
	$('#server-list button.refresh span').text(lang['menu.refresh'] ?? 'Refresh');
	$(':where(#save-list,#server-list,#save-new,#settings,#waypoint-list) button.back span').text(lang['menu.back'] ?? 'Back');
	$(':where(#save-list,#server-list,#ingame-temp-menu,#waypoint-list) button.new span').text(lang['menu.new'] ?? 'New');
	$('#save-new button.new span').text(lang['menu.start'] ?? 'Start');
	$(':where(#confirm,#login,#save-edit,#server-dialog) .cancel').text(lang['menu.cancel'] ?? 'Cancel');
	$(':where(#save-edit,#server-dialog,#waypoint-dialog) .save').text(lang['menu.save'] ?? 'Save');
	$('#connect button.back span,#waypoint-dialog .cancel').text(lang['menu.cancel'] ?? 'Cancel');
	$('#settings button.general span').text(lang['menu.settings.general'] ?? 'General');
	$('#settings button.keybinds span').text(lang['menu.settings.keybinds'] ?? 'Keybinds');
	$('#settings button.debug span').text(lang['menu.settings.debug'] ?? 'Debug');
	$('#map button.waypoints span').text(lang['menu.waypoints'] ?? 'Waypoints');
	$('#ingame-temp-menu div.nav button[section=inventory] span').text(lang['menu.items'] ?? 'Inventory');
	$('#ingame-temp-menu div.nav button[section=screenshots] span').text(lang['menu.screenshots'] ?? 'Screenshots');
	$('#ingame-temp-menu div.nav button[section=shipyard] span').text(lang['menu.shipyard'] ?? 'Shipyard');
	$('#ingame-temp-menu div.nav button[section=lab] span').text(lang['menu.lab'] ?? 'Laboratory');
	emitter.emit('load', lang);
}

export function text(key: string | TemplateStringsArray): string {
	const selectedLang: string = settings.get('locale');
	return store.get(store.has(selectedLang) ? selectedLang : currentLang)?.text?.[typeof key == 'string' ? key : key[0]] || 'Unknown';
}

export const has = (lang: string): boolean => store.has(lang);

export function languages() {
	return [...store.keys()];
}

export async function init(lang: string): Promise<void> {
	const locale = await fetch(lang);
	load(locale.language);
}
