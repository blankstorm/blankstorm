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
		return `Spawned ${spawned.constructor.name} with id #${spawned.id}`;
	},
	data: {
		get: (level, selector, path = '') => {
			let node = level.getNodeBySelector(selector);
			let data = node.getByString(path),
				output = data;
			if (typeof data == 'object' || typeof data == 'function') {
				output = {};
				for (let p of Object.getOwnPropertyNames(data)) {
					output[p] = data[p];
				}
			}
			return `Data of entity #${node.id}: ${output}`;
		},
		set: (level, selector, path, value) => {
			let node = level.getNodeBySelector(selector);
			node.setByString(path, eval?.(value));
		},
	},
	/**
	 * @todo implement executor position as default
	 * @todo
	 */
	tp: (level, selector, x, y, z) => {
		let nodes = level.getNodesBySelector(selector),
			location = new Vector3(+x || 0, +y || 0, +z || 0);
		nodes.forEach(entity => {
			entity.position = location;
		});
		return `Teleported ${nodes.length} to ${location.display()}`;
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
