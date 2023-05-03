import $ from 'jquery';
import { JSONFileMap } from '../core/utils.js';
import fs from './fs.js';

class SettingsError extends Error {
	constructor(message, settingsEntry) {
		super(message);
		this.target = settingsEntry;
	}
}

export class SettingsItem extends HTMLDivElement {
	#id;
	#type;

	#section;
	#store;

	#ui_label = $('<label class=setting-label></label>');
	#ui_input;

	//Used by select
	#options = [];

	//Used by keybind
	#onTrigger;
	#value = {
		//since its not a primative
		alt: false,
		ctrl: false,
		key: '',
	};
	constructor(id, options, store) {
		super();
		$(this).attr('bg', 'none');
		options ||= {};
		this.#id = id;
		this.label = options.label;
		this.#type = options.type;
		this.#store = store;

		if (options.section instanceof SettingsSection) {
			this.#section = options.section;
		} else if (store.sections.has(options.section)) {
			let section = store.sections.get(options.section);
			this.#section = section;
		} else if (options.section) {
			throw new SettingsError(`Settings section "${options.section}" does not exist`);
		}

		switch (this.#type) {
			case 'boolean':
			case 'checkbox':
				this.#ui_input = $('<input></input>');
				this.#ui_input.attr('type', 'checkbox');
				break;
			case 'string':
				this.#ui_input = $('<input></input>');
				this.#ui_input.attr('type', 'text');
				break;
			case 'range':
			case 'number':
			case 'hidden':
			case 'date':
			case 'color':
				this.#ui_input = $('<input></input>');
				this.#ui_input.attr('type', this.#type);
				break;
			case 'select':
				this.#ui_input = $('<select></select>');
				this.#ui_input.text(options.value);
				for (let option of options.options || []) {
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
				throw new SettingsError(`Invalid type: ${this.#type}`, this);
		}

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

	get value() {
		switch (this.#type) {
			case 'boolean':
			case 'checkbox':
				return this.#ui_input.is(':checked');
			case 'range':
			case 'number':
				return +this.#ui_input.val();
			case 'date':
				return new Date(this.#ui_input.val());
			case 'color':
				return this.#ui_input.val(); //TODO: Replace with Babylon Color3?
			case 'keybind':
				return this.#value;
			default:
				return this.#ui_input.val();
		}
	}

	set value(val) {
		switch (this.#type) {
			case 'keybind':
				this.#value = val;
				this.#ui_input.text((val.ctrl ? 'Ctrl + ' : '') + (val.alt ? 'Alt + ' : '') + val.key);
				break;
			case 'boolean':
			case 'checkbox':
				this.#ui_input[0].checked = val;
				break;
			case 'number':
			case 'range':
				this.#ui_input.val(+val);
				break;
			default:
				this.#ui_input.val(val);
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

		for (let attr of ['step', 'min', 'max']) {
			let val = this.#ui_input.attr(attr);
			if (val) {
				data[attr] = isFinite(val) ? +val : val;
			}
		}

		return data;
	}

	//for selects
	hasOption(name) {
		return this.#options.findIndex(el => el.val() == name) != -1;
	}

	addOption(name, label) {
		let option = $('<option></option>');
		option.val(name);
		option.text(label);
		this.#options.push(option);
		this.#ui_input.append(option);
	}

	removeOption(name) {
		let option = this.#options.find(el => el.val() == name);
		if (option) {
			this.#ui_input.remove(option);
			this.#options.splice(this.#options.indexOf(option), 1);
			return true;
		}
		return false;
	}

	//for keybinds
	onTrigger(evt) {
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

export class SettingsSection extends HTMLFormElement {
	#id;
	#parent;
	#store;
	#label;

	constructor(id, label, parent, store) {
		super();
		this.#id = id;

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

	get id() {
		return this.#id;
	}

	get label() {
		return this.#label;
	}

	get parent() {
		return this.#parent;
	}

	set label(value) {
		this.#label = value;
		$(this).find('h2.settings-name').text(`Settings - ${value}`);
	}

	createItem(key, options = {}) {
		return this.#store.createItem(key, options, this);
	}

	dispose(disposeItems) {
		if (disposeItems) {
			for (let item of this.#store.items.values()) {
				if (item.section == this) {
					item.dispose();
				}
			}
		}

		$(this).detach();
		this.#store.sections.delete(this.#id);
	}
}
customElements.define('settings-section', SettingsSection, { extends: 'form' });

export class SettingsStore extends JSONFileMap {
	sections = new Map();
	items = new Map();
	#id;

	constructor({ id = 'settings', sections = [], items = [] }) {
		super(id + '.json', fs);
		this.#id = id;

		for (let section of sections) {
			if (section instanceof SettingsSection) {
				this.sections.set(section.id, section);
			} else {
				this.createSection(section.id, section.label, section.parent);
			}
		}

		const settings = this.getMap();
		for (let item of items) {
			if (item instanceof SettingsItem) {
				this.items.set(item.id, item);
				this.set(item.id, settings.has(item.id) ? settings.get(item.id) : item.value);
			} else {
				this.set(item.id, settings.has(item.id) ? settings.get(item.id) : item.value, item);
			}
		}
	}

	set(key, value, options) {
		super.set(key, value);

		//update item
		if (!this.items.has(key)) {
			const opts = { type: typeof value, ...options, value };
			const item = this.createItem(key, opts);
			item.value = value;
		} else {
			const item = this.items.get(key);
			item.update(options);
		}
	}

	createItem(id, options = {}) {
		const item = new SettingsItem(id, options, this);
		this.items.set(item.id, item);
		return item;
	}

	createSection(id, label, parent) {
		return new SettingsSection(id, label, parent, this);
	}
}
