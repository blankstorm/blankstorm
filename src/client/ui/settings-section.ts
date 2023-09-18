import $ from 'jquery';
import type { SettingsSection } from '../settings';

export class SettingsSectionUI extends HTMLFormElement {

	constructor(protected _target: SettingsSection, protected _parent?: JQuery) {
		super();

		$(this).addClass('settings-section center-flex').append('<h2 class="settings-name"></h2>');

		if (_parent) {
			_parent.append(this);
		}

	}

	get parent() {
		return this._parent;
	}

	set parent(value) {
		$(this).detach().appendTo(value);
		this._parent = value;
	}

	update() {
		$(this).find('h2.settings-name').text(`Settings - ${this._target.label}`);
	}
}
customElements.define('settings-section', SettingsSectionUI, { extends: 'form' });