import { isJSON } from '../core/utils';
import { version } from '../core/meta';
import { settings } from './index';
import $ from 'jquery';

export interface Locale {
	language: string;
	name: string;
	versions: string[];
	text: { [key: string]: string };
}

export class LocaleStore {
	#store: Map<string, Locale> = new Map();
	#currentLang = 'en';

	constructor() {}

	/**
	 * @todo fix circular dependency
	 */
	async fetch(url: string) {
		try {
			const locale = isJSON(url) ? JSON.parse(url) : await $.ajax(url);
			locale.language ||= locale.lang;
			if (typeof locale != 'object') throw 'Not an object';
			if (!locale.language) throw 'Does not have a language';
			if (!(locale.version || locale.versions)) throw 'Does not have a version';
			if (!locale?.text) throw 'Missing data';
			if (locale.version != version && ![...locale.versions].some(v => version.match(v))) throw 'Wrong game version';

			this.#store.set(locale.language, locale);
			//settings.items.get('locale').addOption(locale.language, locale.name); -> circular dependency
			return locale;
		} catch (e) {
			throw new Error(`Failed to load locale from ${url}: ${e}`);
		}
	}

	load(id: string) {
		if (!this.#store.has(id)) throw new Error(`Locale ${id} does not exist`);
		const lang = this.#store.get(id);
		this.#currentLang = id;
		$('#main button.sp').text(lang['menu.singleplayer'] ?? 'Singleplayer');
		$('#main button.mp').text(lang['menu.multiplayer'] ?? 'Multiplayer');
		$('#main button.options,#esc button.options').text(lang['menu.options'] ?? 'Options');
		$('#main button.exit').text(lang['menu.exit'] ?? 'Exit');
		$('#esc button.resume').text(lang['menu.resume'] ?? 'Resume Game');
		$('#esc button.save').text(lang['menu.save_game'] ?? 'Save Game');
		$('#esc button.quit').text(lang['menu.quit'] ?? 'Main Menu');
		$('#save-list button.upload span').text(lang['menu.upload'] ?? 'Upload');
		$('#server-list button.refresh span').text(lang['menu.refresh'] ?? 'Refresh');
		$(':where(#save-list,#server-list,#save-new,#settings) button.back span').text(lang['menu.back'] ?? 'Back');
		$(':where(#save-list,#server-list,#q) button.new span').text(lang['menu.new'] ?? 'New');
		$('#save-new button.new span').text(lang['menu.start'] ?? 'Start');
		$(':where(#confirm,#login,#save-edit,#server-dialog) .cancel').text(lang['menu.cancel'] ?? 'Cancel');
		$(':where(#save-edit,#server-dialog) .save').text(lang['menu.save'] ?? 'Save');
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

	text(key: string | TemplateStringsArray): string {
		return (
			this.#store.get(this.#store.has(settings.get('locale') as string) ? (settings.get('locale') as string) : 'en')?.text?.[typeof key == 'string' ? key : key[0]] ||
			'Unknown'
		);
	}

	has(id: string): boolean {
		return this.#store.has(id);
	}

	get languages() {
		return [...this.#store.keys()];
	}

	get currentLanguage() {
		return this.#currentLang;
	}
}

export const locales = new LocaleStore();
await locales.fetch('locales/en.json');
locales.load('en');
