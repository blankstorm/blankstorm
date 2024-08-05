import type { Player } from '../../core/entities/player';
import type { ItemID } from '../../core/generic/items';
import type { Producible } from '../../core/generic/production';
import type { ResearchID } from '../../core/generic/research';
import { text } from '../locales';
import * as settings from '../settings';
import { minimize } from '../utils';

export function productRequirements(thing: Producible, player: Player): string {
	const materials = (Object.entries(thing.recipe) as [ItemID, number][])
		.map(([id, amount]) => `${text('item.name', id)}: ${minimize(player.storage.count(id))}/${minimize(amount)}`)
		.join('<br>');
	const requires = (Object.entries(thing.requires) as [ResearchID, number][])
		.map(([id, tech]) => `${tech == 0 ? `Incompatible with ${text('tech.name', id)}` : `${text('tech.name', id)}: ${player.research[id]}/${tech}`}`)
		.join('<br>');
	return `<br /><br /><strong>Material Cost</strong>${materials}<br>${Object.keys(thing.requires).length ? `<br><strong>Requires:</strong>` : ``}${requires}${settings.get('tooltips') ? '<br>' + thing.id : ''}`;
}
