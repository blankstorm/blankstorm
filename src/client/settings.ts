import $ from 'jquery';
import { JSONFileMap } from '../core/utils';
const fs = app.require('fs');

export class SettingsError extends Error {
	target: SettingsItem;
	constructor(message: string, settingsEntry?: SettingsItem) {
		super(message);
		this.target = settingsEntry;
	}
}

export class SettingsEvent extends Event {
	constructor(type: string, public item: SettingsItem) {
		super(type);
	}
}

export interface Keybind {
	alt: boolean;
	ctrl: boolean;
	key: string;
}

export const SettingTypes = ['boolean', 'checkbox', 'string', 'range', 'number', 'hidden', 'color', 'select', 'keybind'];
export type SettingType = (typeof SettingTypes)[number];

export type SettingValue = boolean | string | string[] | number | Keybind;

export type SettingLabel<T = SettingValue> = string | ((value?: T) => string);

export interface SettingsItemOptions {
	id: string;
	section: SettingsSection | string;
	label: SettingLabel;
	type: SettingType;
	options: {
		name: string;
		label: string;
	}[];
	value;
	onTrigger(evt: Event | JQuery.KeyDownEvent): unknown;
	min: number;
	max: number;
	step: number;
}

export class SettingsItem extends HTMLDivElement {
	#id: string;
	#type: SettingType;
	label: SettingLabel;

	#section: SettingsSection;
	#store: SettingsMap;

	#ui_label = $('<label></label>').addClass('settings-label').css('text-align', 'right').appendTo(this);
	#ui_input: JQuery<HTMLInputElement>;

	//Used by select
	#options = [];
	#value: Keybind = {
		alt: false,
		ctrl: false,
		key: '',
	};

	//Used by keybind
	constructor(id: string, options: Partial<SettingsItemOptions>, store) {
		super();
		options ||= {};
		this.#id = id;
		this.label = options.label;
		this.#store = store;

		if (options.section instanceof SettingsSection) {
			this.#section = options.section;
		} else if (store.sections.has(options.section)) {
			const section = store.sections.get(options.section);
			this.#section = section;
		} else if (options.section) {
			throw new SettingsError(`Settings section "${options.section}" does not exist`);
		}

		switch (options.type) {
			case 'checkbox':
			case 'boolean':
				this.#ui_input = $('<input></input>');
				this.#ui_input.attr('type', 'checkbox');
				options.type = 'boolean';
				break;
			case 'string':
				this.#ui_input = $('<input></input>');
				this.#ui_input.attr('type', 'text');
				break;
			case 'range':
			case 'number':
			case 'hidden':
			case 'color':
				this.#ui_input = $('<input></input>');
				this.#ui_input.attr('type', options.type);
				options.type = options.type == 'color' ? 'color' : 'number';
				break;
			case 'select':
				this.#ui_input = $('<select></select>');
				this.#ui_input.text(options.value);
				for (const option of options.options || []) {
					this.addOption(option.name, option.label);
				}
				break;
			case 'keybind':
				this.#ui_input = $('<button></button>');
				this.#ui_input
					.on('click', e => {
						e.preventDefault();
						e.target.focus();
					})
					.on('keydown', e => {
						e.preventDefault();
						this.value = {
							alt: e.altKey,
							ctrl: e.ctrlKey,
							key: e.key,
						};
					});
				break;
			default:
				throw new SettingsError(`Invalid type: ${options.type}`, this);
		}

		this.#type = options.type;

		this.#ui_input.attr('name', id).addClass('setting-input');
		$('<div></div>').append(this.#ui_input).appendTo(this);
		$(this).addClass('settings-item');
		if (this.#section) {
			$(this).appendTo(this.#section);
		}

		this.update(options);
		this.#ui_input.on('change', e => {
			this.value = this.type == 'boolean' ? e.target.checked : e.target.value;
			this.#store.set(this.id, this.value);
		});

		if (options.value) {
			this.value = options.value;
		}
	}

	get id() {
		return this.#id;
	}

	get value(): SettingValue {
		switch (this.#type) {
			case 'keybind':
				return this.#value;
			case 'boolean':
				return this.#ui_input.is(':checked');
			case 'number':
				return +this.#ui_input.val();
			default:
				return this.#ui_input.val();
		}
	}

	set value(val: SettingValue) {
		switch (this.#type) {
			case 'keybind':
				this.#value = val as Keybind;
				this.#ui_input.text((this.#value.ctrl ? 'Ctrl + ' : '') + (this.#value.alt ? 'Alt + ' : '') + this.#value.key);
				break;
			case 'boolean':
				this.#ui_input[0].checked = val as boolean;
				break;
			case 'number':
				this.#ui_input.val(+val);
				break;
			default:
				this.#ui_input.val(val as string);
		}

		let label = '';
		if (typeof this.label == 'function') {
			label = this.label(val);
		} else {
			label = this.label;
		}
		this.#ui_label.text(label);
		this.emit('update');
	}

	get type() {
		return this.#type;
	}

	get ui() {
		return $(this);
	}

	get section() {
		return this.#section;
	}

	get metadata() {
		const data = {
			id: this.id,
			type: this.type,
			value: this.value,
		};

		for (const attr of ['step', 'min', 'max']) {
			const val = this.#ui_input.attr(attr);
			if (val) {
				data[attr] = isFinite(+val) ? +val : val;
			}
		}

		return data;
	}

	//for selects
	hasOption(name: string) {
		return this.#options.findIndex(el => el.val() == name) != -1;
	}

	addOption(name: string, label: string) {
		const option = $('<option></option>');
		option.val(name);
		option.text(label);
		this.#options.push(option);
		this.#ui_input.append(option);
	}

	removeOption(name: string): boolean {
		const option = this.#options.find(el => el.val() == name);
		if (option) {
			this.#ui_input.remove(option);
			this.#options.splice(this.#options.indexOf(option), 1);
			return true;
		}
		return false;
	}

	emit(type: string): boolean {
		return this.dispatchEvent(new SettingsEvent(type, this));
	}

	update(options: { min?: number; max?: number; step?: number }) {
		if (isFinite(options?.min)) {
			this.#ui_input.attr('min', +options.min);
		}

		if (isFinite(options?.max)) {
			this.#ui_input.attr('max', +options.max);
		}

		if (isFinite(options?.step)) {
			this.#ui_input.attr('step', +options.step);
		}
	}

	dispose() {
		this.#ui_input.detach();
		this.#store.items.delete(this.#id);
	}
}
customElements.define('settings-item', SettingsItem, { extends: 'div' });

export interface SettingsSectionOptions {
	id: string;
	label: SettingLabel;
	parent: JQuery;
}

export class SettingsSection extends HTMLFormElement {
	#parent: JQuery;
	#store: SettingsMap;
	#label: SettingLabel;

	constructor(public readonly id: string, label: SettingLabel, parent: JQuery, store: SettingsMap) {
		super();

		$(this).addClass('settings-section center-flex').append('<h2 class="settings-name"></h2>');
		this.#label = label;

		if (parent) {
			this.#parent = parent;
			$(parent).append(this);
		}

		if (store) {
			this.#store = store;
			store.sections.set(id, this);
		}
	}

	get label(): string {
		return typeof this.#label == 'function' ? this.#label() : this.#label;
	}

	set label(value: SettingLabel) {
		this.#label = value;
		$(this).find('h2.settings-name').text(`Settings - ${this.label}`);
	}

	get parent() {
		return this.#parent;
	}

	dispose(disposeItems?: boolean) {
		if (disposeItems) {
			for (const item of this.#store.items.values()) {
				if (item.section == this) {
					item.dispose();
				}
			}
		}

		$(this).detach();
		this.#store.sections.delete(this.id);
	}
}
customElements.define('settings-section', SettingsSection, { extends: 'form' });

export class SettingsMap extends JSONFileMap {
	sections: Map<string, SettingsSection> = new Map();
	items: Map<string, SettingsItem> = new Map();

	constructor(
		public readonly id: string = 'settings',
		{
			sections = [],
			items = [],
		}: {
			sections: (SettingsSection | Partial<SettingsSectionOptions>)[];
			items: (SettingsItem | Partial<SettingsItemOptions>)[];
		}
	) {
		super(id + '.json', fs);

		for (const _section of sections) {
			const section = _section instanceof SettingsSection ? _section : new SettingsSection(_section.id, _section.label, _section.parent, this);
			this.sections.set(section.id, section);
		}

		for (const _item of items) {
			const item =
				_item instanceof SettingsItem
					? _item
					: new SettingsItem(_item.id, { type: SettingTypes.includes(typeof _item.value) ? typeof _item.value : 'string', ..._item }, this);
			this.items.set(item.id, item);
			const value = this.has(item.id) ? this.get(item.id) : _item.value;
			item.value = value;
			this.set(item.id, value);
		}
	}
}

export const settings = new SettingsMap('settings', {
	sections: [
		{
			id: 'general',
			label: 'General',
			parent: $('#settings div.general'),
		},
		{
			id: 'keybinds',
			label: 'Keybinds',
			parent: $('#settings div.keybinds'),
		},
		{
			id: 'debug',
			label: 'Debug',
			parent: $('#settings div.debug'),
		},
	],
	items: [
		{
			id: 'font_size',
			section: 'general',
			type: 'range',
			label: val => `Font Size (${val}px)`,
			min: 10,
			max: 20,
			step: 1,
			value: 13,
		},
		{
			id: 'chat_timeout',
			section: 'general',
			type: 'range',
			label: val => `Chat Timeout (${val} seconds)`,
			min: 5,
			max: 15,
			step: 1,
			value: 10,
		},
		{
			id: 'sensitivity',
			section: 'general',
			type: 'range',
			label: val => `Camera Sensitivity (${((val as number) * 100).toFixed()}%)`,
			min: 0.1,
			max: 2,
			step: 0.05,
			value: 1,
		},
		{
			id: 'music',
			section: 'general',
			type: 'range',
			label: val => `Music Volume (${((val as number) * 100).toFixed()}%)`,
			min: 0,
			max: 1,
			step: 0.05,
			value: 1,
		},
		{
			id: 'sfx',
			section: 'general',
			type: 'range',
			label: val => `Sound Effects Volume (${((val as number) * 100).toFixed()}%)`,
			min: 0,
			max: 1,
			step: 0.05,
			value: 1,
		},
		{
			id: 'locale',
			section: 'general',
			type: 'select',
			label: 'Language',
		},
		{
			id: 'show_path_gizmos',
			section: 'debug',
			label: 'Show Path Gizmos',
			value: false,
		},
		{
			id: 'tooltips',
			section: 'debug',
			label: 'Show Advanced Tooltips',
			value: false,
		},
		{
			id: 'disable_saves',
			section: 'debug',
			label: 'Disable Saves',
			value: false,
		},
		{
			id: 'forward',
			section: 'keybinds',
			type: 'keybind',
			label: 'Forward',
			value: { key: 'w' },
		},
		{
			id: 'left',
			section: 'keybinds',
			type: 'keybind',
			label: 'Strafe Left',
			value: { key: 'a' },
		},
		{
			id: 'right',
			section: 'keybinds',
			type: 'keybind',
			label: 'Strafe Right',
			value: { key: 'd' },
		},
		{
			id: 'back',
			section: 'keybinds',
			type: 'keybind',
			label: 'Backward',
			value: { key: 's' },
		},
		{
			id: 'chat',
			section: 'keybinds',
			type: 'keybind',
			label: 'Toggle Chat',
			value: { key: 't' },
		},
		{
			id: 'command',
			section: 'keybinds',
			type: 'keybind',
			label: 'Toggle Command',
			value: { key: '/' },
		},
		{
			id: 'toggle_temp_menu',
			section: 'keybinds',
			type: 'keybind',
			label: 'Toggle Temporary Ingame Menu',
			value: { key: 'Tab' },
		},
		{
			id: 'toggle_menu',
			section: 'keybinds',
			type: 'keybind',
			label: 'Toggle Ingame Menu',
			value: { key: 'e' },
		},
		{
			id: 'toggle_map',
			section: 'keybinds',
			type: 'keybind',
			label: 'Toggle Map',
			value: { key: 'm' },
		},
		{
			id: 'map_move_left',
			section: 'keybinds',
			type: 'keybind',
			label: 'Map Move Left',
			value: { key: 'ArrowLeft' },
		},
		{
			id: 'map_move_down',
			section: 'keybinds',
			type: 'keybind',
			label: 'Map Move Down',
			value: { key: 'ArrowDown' },
		},
		{
			id: 'map_move_right',
			section: 'keybinds',
			type: 'keybind',
			label: 'Map Move Right',
			value: { key: 'ArrowRight' },
		},
		{
			id: 'map_move_up',
			section: 'keybinds',
			type: 'keybind',
			label: 'Map Move Up',
			value: { key: 'ArrowUp' },
		},
		{
			id: 'screenshot',
			section: 'keybinds',
			type: 'keybind',
			label: 'Take Screenshot',
			value: { key: 'F2' },
		},
		{
			id: 'save',
			section: 'keybinds',
			type: 'keybind',
			label: 'Save Game',
			value: { key: 's', ctrl: true },
		},
	],
});
