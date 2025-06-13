import { CopyData } from 'deltablank/core/component.js';
import { EntityWithComponents, type EntityConfig } from 'deltablank/core/entity.js';
import { EntityStorageManager, Fleet, Owner } from '../components';
import { research, type ResearchID } from '../data';

// Note: Fleet loaded after Player
export class Player extends EntityWithComponents(EntityStorageManager, Fleet, Owner, CopyData) {
	static config = {
		self_owned: true,
		max_items: 1e10,
		fleet: {
			max_ships: 9999,
			allow_nesting: false,
		},
		copy_data: ['xp', 'research'],
	} satisfies EntityConfig<[EntityStorageManager, Fleet, Owner, CopyData]>;

	public xp: number = 0;
	public research = Object.fromEntries([...research.keys()].map(k => [k, 0])) as Record<ResearchID, number>;

	public async reset(): Promise<void> {
		this.storage.clear();
		for (const type of research.keys()) {
			this.research[type] = 0;
		}

		for (const ship of this.fleet) await ship.dispose();
	}
}
