import 'jquery'; /* global $ */

export default class SaveCreateDialog extends HTMLDialogElement {
	constructor(){
		super();
		$(this).css('text-align', 'center').append(`
			<svg clickable class="top-right cancel"><use href="images/icons.svg#xmark" /></svg>
			<br>
			<div style="display: none;" class="error"></div>
			<input class="name" placeholder="Name">
			<br>
			<span>Difficulty </span>
			<input
				class="difficulty"
				type="range"
				display="\${{'0.5':'Easy','1':'Normal','1.5':'Hard'"}[val]}'
				min="0.5"
				max="1.5"
				step="0.5"
				value="1"
			>
			<br><br>
			<button class="cancel">Cancel</button><button class="save">Save</button>
		`);
		$(this).find('.cancel').click(e => {
			e.preventDefault();
			$(this).find('.error').hide();
			this.close();
		});
		$(this).find('button.save').click(e => {
			e.preventDefault();
			
			$(this).find('.error').hide();
			this.close();
		});
	}
}

customElements.define('save-create-dialog', SaveCreateDialog, { extends: 'dialog' })