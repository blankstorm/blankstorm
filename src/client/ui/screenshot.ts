import $ from 'jquery';
import { contextMenu } from './utils';
import { confirm } from '../utils';

export class ScreenshotUI extends Image {
	constructor(src: string) {
		super(256);
		this.src = src;
		$(this).appendTo('#ingame-temp-menu div.screenshots');
		const menu = contextMenu(this);
		$('<button><svg><use href="_build.asset_dir/images/icons.svg#download"/></svg> Download</button>')
			.on('click', () => {
				$('<a download=screenshot.png></a>').attr('href', src)[0].click();
			})
			.appendTo(menu);
		$('<br><br>').appendTo(menu);
		$('<button><svg><use href="_build.asset_dir/images/icons.svg#trash"/></svg> Delete</button>')
			.on('click', () => {
				confirm('Are you sure?').then(() => {
					$(this).remove();
				});
			})
			.appendTo(menu);
	}
}
