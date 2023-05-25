import { locales } from '../index';
import { Research } from '../../core/generic/research';
import $ from 'jquery';
import { ui } from '../listeners';

export class ResearchUI extends HTMLDivElement {
	constructor(research: Research) {
		super();

		$(`<span class="locked locked-icon"><svg style=font-size:1.5em><use href=images/icons.svg#lock /></svg></span>
						<span class=name style=text-align:center;>${locales.text(`tech.${research.id}.name`)}</span>
						<span class="upgrade add-or-upgrade-icon"><tool-tip></tool-tip><svg style=font-size:1.5em><use href=images/icons.svg#circle-up /></svg></span>
					`).appendTo(this);

		$(this).find('.upgrade').on('click', research, ui.research).parent().attr('bg', 'none').appendTo('div.lab');
	}
}
