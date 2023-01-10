import { isJSON } from 'core/utils.js';
import { version } from 'core/meta.js';
import { settings } from './index.js';

import 'jquery'; /* global $ */


export class LocaleStore {

	#store = new Map();
	#currentLang = 'en';

	constructor(){

	}

	async fetch(url) {
		let locale = isJSON(url) ? JSON.parse(url) : await $.ajax(url),
			err = msg => {
				throw new Error(`Failed to load locale from ${url}: ${msg}`);
			};
		locale.language ||= locale.lang;
		if (typeof locale != 'object') err('Not an object');
		if (!locale.language) err('Does not have a language');
		if (!(locale.version || locale.versions)) err('Does not have a version');
		if (!locale?.text) err('Missing data');
		if (locale.version != version && ![...locale.versions].some(v => version.match(v))) err('Wrong game version');

		this.#store.set(locale.language, locale);
		settings.items.get('locale').addOption(locale.language, locale.name);
		return locale;
	}

	load(id) {
		if (!this.#store.has(id)) throw new Error(`Locale ${id} does not exist`);
		let lang = this.#store.get(id);
		this.#currentLang = id;
		$('#main button.sp').text(lang['menu.singleplayer'] ?? 'Singleplayer');
		$('#main button.mp').text(lang['menu.multiplayer'] ?? 'Multiplayer');
		$('#main button.options,#esc button.options').text(lang['menu.options'] ?? 'Options');
		$('#main button.exit').text(lang['menu.exit'] ?? 'Exit');
		$('#esc button.resume').text(lang['menu.resume'] ?? 'Resume Game');
		$('#esc button.save').text(lang['menu.save'] ?? 'Save Game');
		$('#esc button.quit').text(lang['menu.quit'] ?? 'Main Menu');
		$('#load button.upload span').text(lang['menu.upload'] ?? 'Upload');
		$(':where(#load,#save,#settings) button.back span').text(lang['menu.back'] ?? 'Back');
		$(':where(#load,#q) button.new span').text(lang['menu.new'] ?? 'New');
		$('#save button.new span').text(lang['menu.start'] ?? 'Start');
		$('#connect button.back span').text(lang['menu.cancel'] ?? 'Cancel');
		$('#settings button.general span').text(lang['menu.settings.general'] ?? 'General');
		$('#settings button.keybinds span').text(lang['menu.settings.keybinds'] ?? 'Keybinds');
		$('#settings button.debug span').text(lang['menu.settings.debug'] ?? 'Debug');
		$('#q div.warp button.warp').text(lang['menu.warp'] ?? 'Jump');
		$('#q div.nav button.inv span').text(lang['menu.items'] ?? 'Inventory');
		$('#q div.nav button.map span').text(lang['menu.map'] ?? 'Waypoints');
		$('#q div.nav button.screenshots span').text(lang['menu.screenshots'] ?? 'Screenshots');
		$('#q div.nav button.warp span').text(lang['menu.hyperspace'] ?? 'Hyperspace');
		$('#e div.nav button.trade span').text(lang['menu.trade'] ?? 'Trade');
		$('#e div.nav button.yrd span').text(lang['menu.shipyard'] ?? 'Shipyard');
		$('#e div.nav button.lab span').text(lang['menu.lab'] ?? 'Laboratory');
	}

	text(key) {
		return this.#store.get(this.#store.has(settings.get('locale')) ? settings.get('locale') : 'en')?.text?.[key] || 'Unknown';
	}

	get languages(){
		return [...this.#store.keys()];
	}

	get currentLanguage() {
		return this.#currentLang;
	}
}