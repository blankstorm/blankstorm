import type { Player } from '../../core/entities/player';
import type { ItemID } from '../../core/generic/items';
import type { Product } from '../../core/generic/production';
import type { Research, ResearchID } from '../../core/generic/research';
import { text } from '../locales';
import * as settings from '../settings';
import { minimize } from '../utils';

export function productRequirements(thing: Product, player: Player): string {
	const materials = (Object.entries(thing.recipe) as [ItemID, number][])
		.map(([id, amount]) => `${text('item.name', id)}: ${minimize(player.storage.count(id))}/${minimize(amount)}`)
		.join('<br>');
	const requires = (Object.entries(thing.requires) as [ResearchID, number][])
		.map(([id, tech]) => `${tech == 0 ? `Incompatible with ${text('tech.name', id)}` : `${text('tech.name', id)}: ${player.research[id]}/${tech}`}`)
		.join('<br>');
	return `<br /><br /><strong>Material Cost</strong>${materials}<br>${Object.keys(thing.requires).length ? `<br><strong>Requires:</strong>` : ``}${requires}${settings.get('tooltips') ? '<br>' + thing.id : ''}`;
}

export function research(tech: Research, player: Player) {
	return `<strong>${text('tech.name', tech.id)}</strong><br>
	${text('tech.description', tech.id)}<br>
	${player.research[tech.id] >= tech.max ? `<strong>Max Level</strong>` : `${player.research[tech.id]} <svg><use href="assets/images/icons.svg#arrow-right" /></svg> ${player.research[tech.id] + 1}`}
	${productRequirements(tech, player)}`;
}
