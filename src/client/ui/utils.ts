import { getCamera } from '../../renderer';
import $ from 'jquery';

export function instantiateTemplate(selector: string): JQuery<DocumentFragment> {
	return $($<HTMLTemplateElement>(selector)[0].content.cloneNode(true) as DocumentFragment);
}

export function switchTo(selector: string, hideAll?: boolean) {
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
