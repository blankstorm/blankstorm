import 'jquery'; /* global $ */

export default class ServerDialog extends HTMLDialogElement {
	constructor() {
		super();
		$(this).css('text-align', 'center').append(`
			<svg clickable class="top-right"><use href="images/icons.svg#xmark" /></svg>
			<div style="display: none;" class="error"></div>
			<input class="name" placeholder="Display name">
			<br>
			<input class="url" placeholder="Server address">
			<br>
			<button class="cancel">Cancel</button><button class="save">Save</button>
		`);
		$(this)
			.find('.cancel')
			.click(e => {
				e.preventDefault();
				$(this).find('.error').hide();
				this.close();
			});
		$(this)
			.find('button.save')
			.click(e => {
				e.preventDefault();

				$(this).find('.error').hide();
				this.close();
			});
	}
}

customElements.define('server-dialog', ServerDialog, { extends: 'dialog' });
