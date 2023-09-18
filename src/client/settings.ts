import $ from 'jquery';
import EventEmitter from 'eventemitter3';
import { JSONFileMap } from '../core/utils';
import { SettingsItemUI } from './ui/settings-item';
import { SettingsSectionUI } from './ui/settings-section';
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

export const SettingTypes = ['boolean', 'string', 'range', 'number', 'hidden', 'color', 'select', 'keybind'];
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

export class SettingsItem extends EventEmitter {
	private _id: string;
	protected _type: SettingType;
	label: SettingLabel;

	protected _section: SettingsSection;
	protected _store: SettingsMap;

	protected _ui: SettingsItemUI;

	//Used by keybind
	constructor(id: string, options: Partial<SettingsItemOptions>, store: SettingsMap) {
		super();
		options ||= {};
		this._id = id;
		this.label = options.label;
		this._store = store;

		if (options.section instanceof SettingsSection) {
			this._section = options.section;
		} else if (store.sections.has(options.section)) {
			const section = store.sections.get(options.section);
			this._section = section;
		} else if (options.section) {
			throw new SettingsError(`Settings section "${options.section}" does not exist`);
		}

		switch (options.type) {
			case 'checkbox':
			case 'boolean':
				options.type = 'boolean';
				break;
			case 'range':
			case 'number':
			case 'hidden':
			case 'color':
				options.type = options.type == 'color' ? 'color' : 'number';
				break;
			case 'string':
			case 'select':
			case 'keybind':
				break;
			default:
				throw new SettingsError(`Invalid type: ${options.type}`, this);
		}

		this._type = options.type;
		this._ui = new SettingsItemUI(this);
		this.update(options);

		if (options.value) {
			this.value = options.value;
		}
		
	}

	get id() {
		return this._id;
	}

	get value(): SettingValue {
		return this.ui.value;
	}

	set value(val: SettingValue) {
		this._ui.value = val;
		this.emit('update');
	}

	get type(): SettingType {
		return this._type;
	}

	get ui() {
		return this._ui;
	}

	get section() {
		return this._section;
	}

	get store() {
		return this._store;
	}

	get metadata() {
		const data = {
			id: this.id,
			type: this.type,
			value: this.value,
		};

		for (const attr of ['step', 'min', 'max']) {
			const val = this._ui.getAttribute(attr);
			if (val) {
				data[attr] = isFinite(+val) ? +val : val;
			}
		}

		return data;
	}

	update(options: { min?: number; max?: number; step?: number }) {
		if (isFinite(options?.min)) {
			this._ui._input.attr('min', +options.min);
		}

		if (isFinite(options?.max)) {
			this._ui._input.attr('max', +options.max);
		}

		if (isFinite(options?.step)) {
			this._ui._input.attr('step', +options.step);
		}
	}

	dispose() {
		this._ui._input.detach();
		this._store.items.delete(this._id);
	}
}

export interface SettingsSectionOptions {
	id: string;
	label: SettingLabel;
	parent: JQuery;
}

export class SettingsSection extends EventEmitter {
	ui: SettingsSectionUI;

	constructor(public readonly id: string, protected _label: SettingLabel, protected _store: SettingsMap) {
		super();

		if (_store) {
			_store.sections.set(id, this);
		}

		this.ui = new SettingsSectionUI(this);
	}

	get store(): SettingsMap {
		return this._store;
	}

	get label(): string {
		return typeof this._label == 'function' ? this._label() : this._label;
	}

	set label(value: SettingLabel) {
		this._label = value;
		this.ui.update();
	}

	get parent() {
		return this.ui.parent;
	}

	set parent(value) {
		this.ui.parent = value;
	}

	dispose(disposeItems?: boolean) {
		if (disposeItems) {
			for (const item of this._store.items.values()) {
				if (item.section == this) {
					item.dispose();
				}
			}
		}

		$(this).detach();
		this._store.sections.delete(this.id);
	}
}

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
			const section = _section instanceof SettingsSection ? _section : new SettingsSection(_section.id, _section.label, this);
			section.ui.parent = _section.parent;
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
