import $ from 'jquery';

export function contextMenu(target: JQuery | HTMLElement | string | JQuery.PlainObject) {
	const jq = $(target);
	const menu = $('<div></div>').addClass('bg-light content-menu');
	menu.css({ position: 'fixed', width: 'fit-content', height: 'fit-content', 'max-width': '15%', padding: '1em', 'z-index': 9 });
	jq.on('contextmenu', e => {
		e.preventDefault();
		menu.css({ left: e.pageX, top: e.pageY });
		jq.parent().append(menu);
		const height = parseFloat(getComputedStyle(menu[0]).height);
		menu.css('top', e.pageY + height < innerHeight ? e.pageY : e.pageY - height);
	});
	return menu;
}
