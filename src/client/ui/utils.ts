import $ from 'jquery';
import { getCamera } from '~/renderer';

export function changeUI(selector: string, hideAll?: boolean) {
	if ($(selector).is(':visible')) {
		$('canvas.game').trigger('focus');
		$(selector).hide();
	} else if ($('.game-ui').not(selector).is(':visible') && hideAll) {
		$('canvas.game').trigger('focus');
		$('.game-ui').hide();
	} else if (!$('.game-ui').is(':visible')) {
		getCamera().detachControl();
		$(selector).show().trigger('focus');
	}
}
