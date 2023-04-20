import { login } from 'core/api.js';
import 'jquery'; /* global $ */

export default class LoginUI extends HTMLDialogElement {
	constructor() {
		super();
		$(this).css('text-align', 'center').append(`
		<svg clickable style="position: absolute; right: 1em; top: 1em;" ><use href="images/icons.svg#xmark" /></svg>
			<h3>Login</h3>
			<div style="display: none;" class="error"></div>
			<form bg=none>
				<br>
				<input name="email" autocomplete="email">
				<br>
				<input name="password" type="password" autocomplete="current-password">
				<br>
				<br>
				<button>Login</button>
			</form>
		`);
		$(this).find('button').click(async e => {
			e.preventDefault();
			const data = new FormData($(this).find('form')[0]);
			try {
				const res = await login(data.get('email'), data.get('password'));
				document.cookie = `token=${res.result.token}`;
				this.close();
			} catch (e) {
				const error = $(this).find('.error');
				error.text(e.message).show();
			}
		});
		$(this).find('svg').click(() => {
			this.close();
		});
	}
}

customElements.define('ui-login', LoginUI, { extends: 'dialog' });
