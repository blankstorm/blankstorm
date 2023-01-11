import 'jquery'; /* global $ */

import { settings } from './index.js';

$.fn.cm = function (...content) {
	content ||= [$('<p></p>')];
	let menu = $('<div bg=light class=cm></div>');
	for (let c of content) {
		menu.append(c, $('<br>'));
	}
	menu.css({ position: 'fixed', width: 'fit-content', height: 'fit-content', 'max-width': '15%', padding: '1em', 'z-index': 9 });
	this.on('contextmenu', e => {
		e.preventDefault();
		menu.css({ left: settings.get('font_size') + e.pageX, top: settings.get('font_size') + e.pageY });
		this.parent().append(menu);
		menu.css({
			top:
				settings.get('font_size') + e.pageY + parseFloat(getComputedStyle(menu[0]).height) < innerHeight
					? settings.get('font_size') + e.pageY
					: settings.get('font_size') + e.pageY - parseFloat(getComputedStyle(menu[0]).height),
		});
	});
	return this;
};
