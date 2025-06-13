import $ from 'jquery';
import * as fs from 'node:fs';
import { isJSON } from 'utilium';
import type { JSONObject } from 'utilium/fs.js';
import { JSONFileMap } from 'utilium/fs.js';
import { config } from '../core';
import { path } from './config';
import { logger } from './utils';
import { EventEmitter } from 'eventemitter3';
import { instantiateTemplate } from './ui/utils';

export const settingTypes = ['boolean', 'string', 'number', 'color', 'select', 'keybind'] as const;

export class SettingsError<T extends Type = Type> extends Error {
	constructor(
		message: string,
		public target?: Item<T>
	) {
		super(message);
	}
}

export class SettingsEvent<T extends Type = Type> extends Event {
	constructor(
		type: string,
		public item: Item<T>
	) {
		super(type);
	}
}

export interface Keybind extends JSONObject {
	alt: boolean;
	ctrl: boolean;
	key: string;
}

type Type = (typeof settingTypes)[number];
type Value<T extends Type = Type> = {
	boolean: boolean;
	string: string;
	number: number;
	color: string;
	select: string | string[];
	keybind: Keybind;
}[T];

type Label<T extends Type = Type> = string | ((value?: Value<T>) => string);
type Attributes<T extends Type> = T extends 'number' ? { min: number; max: number; step: number } : undefined;

export interface ItemConfig<T extends Type = Type> {
	id: string;
	section: Section | string;
	label: Label<T>;
	type: T;
	options?: {
		name: string;
		label: string;
	}[];
	value: Value<T>;
	attributes?: Attributes<T>;
}

const htmlTypes = {
	boolean: 'checkbox',
	string: 'text',
	number: 'range',
	color: 'color',
	select: 'hidden',
	keybind: 'button',
} satisfies Record<Type, string>;

/**
 * @todo Fix this type nonsense
 */
export class Item<T extends Type = Type> extends EventEmitter<{
	change: [value: Value<T>];
}> {
	public readonly id: string;
	public readonly type: T;
	public readonly section: Section;

	public label: Label<T>;

	//Used by select
	private select_options = new Map<string, JQuery<HTMLOptionElement>>();

	//Used by keybind
	private keybind_value: Keybind = {
		alt: false,
		ctrl: false,
		key: '',
	};

	public onTrigger?(evt: Event | JQuery.KeyDownEvent): unknown;

	public readonly ui: JQuery<HTMLDivElement>;

	public readonly defaultValue: Value<T>;

	public constructor({ id, type, label, section, value, options, attributes }: ItemConfig<T>) {
		super();
		this.id = id;
		this.type = type;
		this.label = label;
		this.defaultValue = value;
		this.ui = instantiateTemplate('#setting').find<HTMLDivElement>('div.setting');

		const _section = section instanceof Section ? section : sections.get(section);
		if (!_section) {
			throw new SettingsError(`Invalid section for setting "${id}"`, this);
		}
		this.section = _section;

		if (!settingTypes.includes(this.type)) {
			throw new SettingsError(`Invalid type for setting "${id}"`, this);
		}

		this.ui.find('input').attr({ type: htmlTypes[this.type], name: this.id });

		if (this.type == 'select') {
			$('<select class="input"></select>').appendTo(this.ui.find('div.input-container'));
			this.ui.find('input').removeClass('input');
			for (const option of options || []) {
				this.addOption(option.name, option.label);
			}
		}
		if (this.type == 'keybind') {
			this.ui
				.find('input')
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
					set(this.id, this.value);
				});
		}

		this.section.ui.append(this.ui);

		const input = this.ui.find('.input');
		if (attributes) {
			input.attr(attributes);
		}
		this.updateLabel();

		input.on('change', () => {
			this.value = (this.type == 'boolean' ? input.is(':checked') : input.val()) as Value<T>;
			set(this.id, this.value);
		});

		this.value = value;
	}

	public get value(): Value<T> {
		switch (this.type) {
			case 'keybind':
				return this.keybind_value as Value<T>;
			case 'boolean':
				return this.ui.find('input').is(':checked') as Value<T>;
			case 'number':
				return +this.ui.find('input').val()! as Value<T>;
			default:
				return this.ui.find('.input').val()! as Value<T>;
		}
	}

	public set value(val: Value) {
		switch (this.type) {
			case 'keybind':
				this.keybind_value = val as Value<T> & Keybind;
				this.ui
					.find('input')
					.val((this.keybind_value.ctrl ? 'Ctrl + ' : '') + (this.keybind_value.alt ? 'Alt + ' : '') + this.keybind_value.key);
				break;
			case 'boolean':
				this.ui.find('input')[0].checked = val as boolean;
				break;
			case 'number':
				this.ui.find('input').val(+val);
				break;
			default:
				this.ui.find('.input').val(val as string);
		}
		this.updateLabel();
		this.emit('change', this.value);
	}

	//for selects
	public addOption(name: string, label: string): void {
		const option = $<HTMLOptionElement>('<option></option>');
		option.val(name);
		option.text(label);
		this.select_options.set(name, option);
		this.ui.find('select').append(option);
	}

	public updateLabel(): void {
		this.ui.find('label').text(typeof this.label == 'function' ? this.label(this.value) : this.label);
	}

	public delete(): void {
		this.ui.detach();
		items.delete(this.id);
	}
}

export class Section {
	public readonly ui: JQuery<HTMLFormElement>;
	public readonly button: JQuery<HTMLButtonElement>;

	public constructor(
		public readonly id: string,
		public readonly icon: string
	) {
		const ui = instantiateTemplate('#settings-section');
		ui.children().attr('section', id);
		this.ui = ui.find('form').appendTo('#settings');
		ui.find('button use').attr('href', 'assets/images/icons.svg#' + icon);
		this.button = ui.find('button').appendTo('#settings-nav');
		sections.set(id, this);
	}

	public dispose(disposeItems?: boolean): void {
		if (disposeItems) {
			for (const item of items.values()) {
				if (item.section == this) {
					item.delete();
				}
			}
		}

		this.ui.remove();
		sections.delete(this.id);
	}
}

export const sections: Map<string, Section> = new Map();
export const items: Map<string, Item> = new Map();

let file: JSONFileMap;

export let initialized: boolean = false;

export function init(): void {
	if (initialized) {
		logger.warn('Already initialized settings');
	}
	const filePath = path + '/settings.json',
		exists = fs.existsSync(filePath);
	if (!exists) {
		logger.warn('Settings file does not exist, will be created');
	}
	if (exists && !isJSON(fs.readFileSync(filePath, 'utf8'))) {
		logger.warn('Invalid settings file (overwriting)');
		fs.rmSync(filePath);
	}
	file = new JSONFileMap(filePath, config);
	initialized = true;
}

export interface SettingsSectionConfig {
	id: string;
	icon: string;
	isDefault?: boolean;
}

export function load(config: { sections: SettingsSectionConfig[]; items: ItemConfig[] }): void {
	if (!initialized) {
		throw new Error('Can not load settings before initialization');
	}
	for (const { id, icon, isDefault } of config.sections) {
		logger.debug('Loading settings section: ' + id);
		const section = new Section(id, icon);
		if (isDefault) {
			section.ui.css('display', 'flex');
		}
	}

	for (const itemConfig of config.items) {
		logger.debug('Loading setting: ' + itemConfig.id);
		const value: Value = file.has(itemConfig.id) ? file.get(itemConfig.id) : itemConfig.value;
		const item = new Item(itemConfig);
		items.set(item.id, item);
		item.value = value;
		file.set(item.id, value);
	}
}

export function updateUI() {
	for (const item of items.values()) {
		item.updateLabel();
	}
}

export function reset(): void {
	for (const [id, item] of items) {
		item.value = item.defaultValue;
		file.set(id, item.defaultValue);
	}
	updateUI();
}

export const get: (typeof file)['get'] = key => file.get(key);
export const has: (typeof file)['has'] = key => file.has(key);
export const set: (typeof file)['set'] = (key, val) => file.set(key, val);
export const ids: (typeof file)['keys'] = () => file.keys();
export const entries: (typeof file)['entries'] = () => file.entries();
export const servers: (typeof file)['values'] = () => file.values();
