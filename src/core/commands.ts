import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { addCommand } from 'deltablank/core/commands.js';
import { isJSON } from 'utilium';
import type { Player } from './entities/player';
import { ships, type ShipType } from './entities/ships';
import { game_url } from './metadata';

addCommand({
	name: 'help',
	permissionLevel: 0,
	exec() {
		return `See ${game_url}/docs/commands for command documentation`;
	},
});

addCommand({
	name: 'remove',
	permissionLevel: 3,
	exec({ executor }, selector) {
		const entities = executor.level.selectEntities(selector);
		let i = 0;
		for (const entity of entities) {
			void entity.dispose();
			i++;
		}
		return `Removed ${i} entities`;
	},
});

addCommand({
	name: 'spawn',
	permissionLevel: 3,
	exec({ executor }, type: ShipType, selector, extra) {
		const parent: Player = executor.level.entity(selector);
		const spawned = new ships[type](undefined, executor.level);
		spawned.parent = spawned.owner = parent;
		if (isJSON(extra)) {
			//spawned.update(JSON.parse(extra));
		}
		return `Spawned ${spawned.constructor.name} with id #${spawned.id}`;
	},
});

/**
 * @todo implement executor position as default
 */
addCommand({
	name: 'tp',
	permissionLevel: 3,
	exec({ executor }, selector, x, y, z) {
		const entities = executor.level.selectEntities(selector),
			location = new Vector3(+x || 0, +y || 0, +z || 0);
		let i = 0;
		for (const entity of entities) {
			entity.position = location;
			i++;
		}
		return `Teleported ${i} entities`;
	},
});
