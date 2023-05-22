import $ from 'jquery';
import { JSONFileMap } from '../core/utils';
import fs from './fs';

export class SettingsError extends Error {
	target: SettingsItem;
	constructor(message: string, settingsEntry?: SettingsItem) {
		super(message);
		this.target = settingsEntry;
	}
}

export interface Keybind {
	alt: boolean;
	ctrl: boolean;
	key: string;
}

export const SettingTypes = ['boolean', 'checkbox', 'string', 'range', 'number', 'hidden', 'color', 'select', 'keybind'];
export type SettingType = typeof SettingTypes[number];

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

	#ui_label = $('<label class=setting-label></label>');
	#ui_input: JQuery<HTMLInputElement>;

	//Used by select
	#options = [];
	#value: Keybind = {
		alt: false,
		ctrl: false,
		key: '',
	};

	//Used by keybind
	#onTrigger: (evt: Event | JQuery.KeyDownEvent) => unknown;
	constructor(id: string, options: Partial<SettingsItemOptions>, store) {
		super();
		$(this).attr('bg', 'none');
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
				this.#onTrigger = options.onTrigger;
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

		this.#ui_input.attr('name', id);
		this.#ui_input.addClass('setting-input');

		$(this).append(this.#ui_label, this.#ui_input);
		if (this.#section) {
			$(this).appendTo(this.#section);
		}
		$(this).after('<br><br>');

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

	//for keybinds
	onTrigger(evt?: Event | JQuery.KeyDownEvent) {
		if (this.#type != 'keybind') {
			throw new SettingsError('Attempted to call onTrigger for a non-keybind', this);
		}

		this.#onTrigger(evt);
	}

	update(options) {
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

		$(this).append('<h2 class=settings-name></h2>').addClass('settings-section');
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

	createItem(key: string, options: Partial<SettingsItemOptions> = {}) {
		return this.#store.createItem(key, { ...options, section: this });
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

		for (const section of sections) {
			if (section instanceof SettingsSection) {
				this.sections.set(section.id, section);
			} else {
				this.createSection(section.id, section.label, section.parent);
			}
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

	createItem(id: string, options: Partial<SettingsItemOptions> = {}): SettingsItem {
		const item = new SettingsItem(id, options, this);
		this.items.set(item.id, item);
		return item;
	}

	createSection(id: string, label: SettingLabel, parent: JQuery): SettingsSection {
		return new SettingsSection(id, label, parent, this);
	}
}
