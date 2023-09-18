import $ from 'jquery';
import type { Keybind, SettingValue, SettingsItem } from '../settings';
import { SettingsError } from '../settings';

export class SettingsItemUI extends HTMLDivElement {
	private _label = $('<label></label>').addClass('settings-label').css('text-align', 'right').appendTo(this);
	_input: JQuery<HTMLInputElement>;

	private _keybind: Keybind = {
		alt: false,
		ctrl: false,
		key: '',
	};

	private _options = [];

	//Used by keybind
	constructor(private target: SettingsItem) {
		super();

		switch (target.type) {
			case 'checkbox':
			case 'boolean':
				this._input = $('<input></input>');
				this._input.attr('type', 'checkbox');
				break;
			case 'string':
				this._input = $('<input></input>');
				this._input.attr('type', 'text');
				break;
			case 'range':
			case 'number':
			case 'hidden':
			case 'color':
				this._input = $('<input></input>');
				this._input.attr('type', target.type);
				break;
			case 'select':
				this._input = $('<select></select>');
				break;
			case 'keybind':
				this._input = $('<button></button>');
				this._input
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
				throw new SettingsError(`Invalid type: ${target.type}`, target);
		}

		this._input.attr('name', target.id).addClass('setting-input');
		this._input.appendTo(this);
		$(this).addClass('settings-item');

		if (target.section.ui) {
			$(this).appendTo(target.section.ui);
		}

		this.update();
		this._input.on('change', e => {
			this.value = target.type == 'boolean' ? e.target.checked : e.target.value;
			target.store.set(this.id, this.value);
		});
		this.update();
	}

	get value(): SettingValue {
		switch (this.target.type) {
			case 'keybind':
				return this._keybind;
			case 'boolean':
				return this._input.is(':checked');
			case 'number':
				return +this._input.val();
			default:
				return this._input.val();
		}
	}

	set value(val: SettingValue) {
		switch (this.target.type) {
			case 'keybind':
				this._keybind = val as Keybind;
				this._input.text((this._keybind.ctrl ? 'Ctrl + ' : '') + (this._keybind.alt ? 'Alt + ' : '') + this._keybind.key);
				break;
			case 'boolean':
				this._input[0].checked = val as boolean;
				break;
			case 'number':
				this._input.val(+val);
				break;
			default:
				this._input.val(val as string);
		}
	}

	//for selects
	hasOption(name: string) {
		return this._options.findIndex(el => el.val() == name) != -1;
	}

	addOption(name: string, label: string) {
		const option = $('<option></option>');
		option.val(name);
		option.text(label);
		this._options.push(option);
		this._input.append(option);
	}

	removeOption(name: string): boolean {
		const option = this._options.find(el => el.val() == name);
		if (option) {
			this._input.remove(option);
			this._options.splice(this._options.indexOf(option), 1);
			return true;
		}
		return false;
	}

	update(options: { min?: number; max?: number; step?: number } = {}) {
		if (isFinite(options?.min)) {
			this._input.attr('min', +options.min);
		}

		if (isFinite(options?.max)) {
			this._input.attr('max', +options.max);
		}

		if (isFinite(options?.step)) {
			this._input.attr('step', +options.step);
		}

		let label = '';
		if (typeof this.target.label == 'function') {
			label = this.target.label(this.value);
		} else {
			label = this.target.label;
		}
		this._label.text(label);
	}

}
customElements.define('settings-item', SettingsItemUI, { extends: 'div' });
