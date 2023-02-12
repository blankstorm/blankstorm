import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import Ship from './entities/Ship.js';
import { isJSON } from './utils.js';

export const commands = {
	help: () => {
		return 'See https://bs.drvortex.dev/docs/commands for command documentation';
	},
	kill: (level, selector) => {
		let entities = level.getNodesBySelector(selector);
		entities.forEach(e => e.remove());
		return `killed ${entities.length} entities`;
	},
	spawn: (level, type, selector, extra) => {
		const parent = level.getNodeBySelector(selector);
		const spawned = new Ship({ parent, owner: parent, level, type });
		if (isJSON(extra)) {
			spawned.update(JSON.parse(extra));
		}
	},
	data: {
		get: (level, selector, path = '') => {
			let entityOrBody = level.getEntities(selector) ?? level.getBodies(selector);
			if (entityOrBody instanceof Array) throw new SyntaxError('passed selector can only return one entity or body');
			let data = entityOrBody.getByString(path),
				output = data;
			if (typeof data == 'object' || typeof data == 'function') {
				output = {};
				for (let p of Object.getOwnPropertyNames(data)) {
					output[p] = data[p];
				}
			}
			return `Data of entity #${entityOrBody.id}: ${output}`;
		},
		set: (level, selector, path, value) => {
			let entityOrBody = level.getEntities(selector) ?? level.getBodies(selector);
			if (entityOrBody instanceof Array) throw new SyntaxError('passed selector can only return one entity or body');
			entityOrBody.setByString(path, eval?.(value));
		},
	},
	tp: (level, selector, x, y, z) => {
		let entities = level.getEntities(selector),
			location = new Vector3(+x || 0, +y || 0, +z || 0); //TODO: || 0 -> || executor.position
		if (entities instanceof Array) {
			entities.forEach(entity => {
				entity.position = location;
				//TODO: properly implement with checks for ships
			});
			return `Teleported ${entities.length} to ${location.display()}`;
		} else {
			entities.position = location;
			return `Teleported entities #${entities.id} to ${location.display()}`;
		}
	},
};
export const runCommand = (command, level) => {
	//if (!(level instanceof Level)) throw new TypeError('Failed to run command: no level selected'); Level not imported due to overhead
	let splitCmd = command.split(' '),
		hasRun = false;
	let result =
		splitCmd
			.filter(p => p)
			.reduce(
				(o, p, i) =>
					typeof o?.[p] == 'function'
						? ((hasRun = true), o?.[p](level, ...splitCmd.slice(i + 1)))
						: hasRun
						? o
						: o?.[p]
						? o?.[p]
						: new ReferenceError('Command does not exist'),
				commands
			) ?? '';
	return result;
};
