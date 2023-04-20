import { login } from 'core/api.js';
import 'jquery'; /* global $ */

export default class LoginDialog extends HTMLDialogElement {
	constructor() {
		super();
		$(this).css('text-align', 'center').append(`
			<svg clickable class="top-right cancel"><use href="images/icons.svg#xmark" /></svg>
			<h3>Login</h3>
			<div style="display: none;" class="error"></div>
			<br>
			<input class="email" autocomplete="email" placeholder="Email">
			<br>
			<input class="password" autocomplete="current-password" placeholder="Password" type="password">
			<br>
			<br>
			<button class="cancel">Cancel</button><button class="login">Login</button>
		`);
		$(this).find('.cancel').click(e => {
			e.preventDefault();
			$(this).find('.error').hide();
			this.close();
		});
		$(this).find('button.login').click(async e => {
			e.preventDefault();
			try {
				const email = $(this).find('input.email').val();
				const password = $(this).find('input.password').val();
				const res = await login(email, password);
				document.cookie = `token=${res.result.token}`;
				$(this).find('.error').hide().text('');
				this.close();
			} catch (e) {
				$(this).find('.error').text(e.message).show();
			}
		});
	}
}

customElements.define('login-dialog', LoginDialog, { extends: 'dialog' });
