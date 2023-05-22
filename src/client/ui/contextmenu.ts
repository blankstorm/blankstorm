import $ from 'jquery';

export function contextMenu(jq: JQuery, ...content) {
	content ||= [$('<p></p>')];
	const menu = $('<div bg=light class=cm></div>');
	for (const c of content) {
		menu.append(c, $('<br>'));
	}
	menu.css({ position: 'fixed', width: 'fit-content', height: 'fit-content', 'max-width': '15%', padding: '1em', 'z-index': 9 });
	jq.on('contextmenu', e => {
		e.preventDefault();
		menu.css({ left: e.pageX, top: e.pageY });
		this.parent().append(menu);
		const height = parseFloat(getComputedStyle(menu[0]).height);
		menu.css('top', e.pageY + height < innerHeight ? e.pageY : e.pageY - height);
	});
	return jq;
}
