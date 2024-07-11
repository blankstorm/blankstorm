import $ from 'jquery';
import type { Research } from '../../core/generic/research';
import * as locales from '../locales';
import { action } from '../user';
import { instaniateTemplate } from './utils';

export function createResearchUI(research: Research): DocumentFragment {
	const instance = instaniateTemplate('#research');
	instance.querySelector('.name')!.textContent = locales.text(`tech.${research.id}.name`);
	instance.querySelector('.upgrade')!.addEventListener('click', () => action('research', research));
	const $lab = $('div.lab');
	console.log($lab[0]);
	$lab.append(instance);
	return instance;
}
