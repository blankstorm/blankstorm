import 'jquery'; /* global $*/

class SettingsError extends Error {
	constructor(message, settingsEntry) {
		super(message);
		this.target = settingsEntry;
	}
}

class SettingsItem {
	#id;
	#ui;
	label;
	#label_ui = $('<label class=setting-label></label>');
	#ui_container = $('<div class=setting-container></div>').attr('bg', 'none');
	#type;
	#store;
	#section;

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
				this.#ui = $('<input></input>');
				this.#ui.attr('type', 'checkbox');
				break;
			case 'string':
				this.#ui = $('<input></input>');
				this.#ui.attr('type', 'text');
				break;
			case 'range':
			case 'number':
			case 'hidden':
			case 'date':
			case 'color':
				this.#ui = $('<input></input>');
				this.#ui.attr('type', this.#type);
				break;
			case 'select':
				this.#ui = $('<select></select>');
				this.#ui.text(options.value);
				for (let option of options.options || []) {
					this.addOption(option.name, option.label);
				}
				break;
			case 'keybind':
				this.#ui = $('<button></button>');
				this.#onTrigger = options.onTrigger;
				this.#ui
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

		this.#ui.attr('name', id);
		this.#ui.addClass('setting-input');

		store.items.set(id, this);
		this.update(options);

		this.#ui_container.append(this.#label_ui, this.#ui);
		if (this.#section) {
			this.#section.ui.append(this.#ui_container);
		}
		this.#ui_container.after('<br><br>');

		this.#ui.on('change', { item: this }, e => {
			e.data.item.value = e.data.item.type == 'boolean' ? e.target.checked : e.target.value;
		});

		if(options.value){
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
				return this.#ui.is(':checked');
			case 'range':
			case 'number':
				return +this.#ui.val();
			case 'date':
				return new Date(this.#ui.val());
			case 'color':
				return this.#ui.val(); //TODO: Replace with Babylon Color3?
			case 'keybind':
				return this.#value;
			default:
				return this.#ui.val();
		}
	}

	set value(val) {
		switch (this.#type) {
			case 'keybind':
				this.#value = val;
				this.#ui.text((val.ctrl ? 'Ctrl + ' : '') + (val.alt ? 'Alt + ' : '') + val.key);
				this.#store.set(this.#id, val);
				break;
			case 'boolean':
			case 'checkbox':
				this.#ui[0].checked = val;
				this.#store.set(this.#id, val);
				break;
			case 'number':
			case 'range':
				this.#ui.val(+val);
				this.#store.set(this.#id, +val);
				break;
			default:
				this.#ui.val(val);
				this.#store.set(this.#id, val);
		}

		let label = '';
		if (typeof this.label == 'function') {
			label = this.label(val);
		} else {
			label = this.label;
		}
		this.#label_ui.text(label);
	}

	get type() {
		return this.#type;
	}

	get ui() {
		return this.#ui_container;
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
			let val = this.#ui.attr(attr);
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
		this.#ui.append(option);
	}

	removeOption(name) {
		let option = this.#options.find(el => el.val() == name);
		if (option) {
			this.#ui.remove(option);
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
			this.#ui.attr('min', +options.min);
		}

		if (isFinite(options?.max)) {
			this.#ui.attr('max', +options.max);
		}

		if (isFinite(options?.step)) {
			this.#ui.attr('step', +options.step);
		}
	}

	dispose() {
		this.#ui.detach();
		this.#store.items.delete(this.#id);
	}
}

export class SettingsStore {
	sections = new Map();
	items = new Map();
	#id;

	constructor({ id = 'settings', sections = [], items = [] }) {
		this.#id = id;
		if (!localStorage[id]) {
			localStorage[id] = '{}';
		}
		let settings = JSON.parse(localStorage[this.#id]);

		for (let section of sections) {
			if (section instanceof SettingsSection) {
				this.sections.set(section.id, section);
			} else {
				this.createSection(section.id, section.label, section.parent);
			}
		}

		for (let item of items) {
			if (item instanceof SettingsItem) {
				this.items.set(item.id, item);
				this.set(item.id, settings[item.id] ?? item.value);
			} else {
				this.set(item.id, settings[item.id] ?? item.value, item);
			}
		}
	}

	#get() {
		return JSON.parse(localStorage[this.#id]);
	}

	has(key) {
		let settings = this.#get();
		return Object.prototype.hasOwnProperty.call(settings, key);
	}

	get(key) {
		let settings = this.#get();
		return this.has(key) ? settings[key] : undefined;
	}

	getMetadata(key) {
		let item = this.items.get(key);

		if (!item) {
			throw new SettingsError(`Setting "${key}" does not exist`, this);
		}

		return item.metadata;
	}

	set(key, value, options) {
		//update the localStorage value
		let settings = JSON.parse(localStorage[this.#id]);
		settings[key] = value;
		localStorage[this.#id] = JSON.stringify(settings);

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

	getSection(id) {
		return this.sections.get(id);
	}

	createItem(id, options = {}) {
		const item = new SettingsItem(id, options, this);
		return item;
	}

	createSection(id, label, parent) {
		const section = new SettingsSection(id, label, parent, this);
		this.sections.set(id, section);
		return section;
	}
}

export class SettingsSection {
	#id;
	#ui = $('<form><h2 class=settings-name></h2></form>');
	#parent;
	#store;
	#label;

	constructor(id, label, parent, store) {
		this.#id = id;
		this.#label = label;

		if (parent) {
			this.#parent = parent;
			this.#ui.appendTo(parent);
		}

		this.#store = store;
	}

	get id() {
		return this.#id;
	}

	get ui() {
		return this.#ui;
	}

	get label() {
		return this.#label;
	}

	get parent() {
		return this.#parent;
	}

	set label(value) {
		this.#ui.children('h2.settings-name').text(`Settings - ${value}`);
		this.#label = value;
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

		this.#ui.detach();
		this.#store.sections.delete(this.#id);
	}
}
