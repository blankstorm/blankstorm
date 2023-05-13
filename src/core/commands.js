import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import Ship from './entities/Ship.js';
import { isJSON } from './utils.js';

export class Command {
	#exec = () => {};
	#oplvl = 0;
	constructor(exec, oplvl) {
		this.#exec = exec;
		this.#oplvl = oplvl;
	}

	get oplvl() {
		return this.#oplvl;
	}

	exec(args, executor) {
		if (executor?.oplvl < this.oplvl) {
			return 'You do not have permission to run that command';
		}

		return this.#exec.apply({ executor }, args);
	}
}

export const commands = new Map(
	Object.entries({
		help: new Command(() => {
			return 'See https://bs.drvortex.dev/docs/commands for command documentation';
		}, 0),
		kill: new Command(({ executor }, selector) => {
			let entities = executor.level.getNodesBySelector(selector);
			entities.forEach(e => e.remove());
			return `killed ${entities.length} entities`;
		}, 3),
		spawn: new Command(({ executor }, type, selector, extra) => {
			const parent = executor.level.getNodeBySelector(selector);
			const spawned = new Ship(null, executor.level, { type, power: executor.power });
			spawned.parent = spawned.owner = parent;
			if (isJSON(extra)) {
				spawned.update(JSON.parse(extra));
			}
			return `Spawned ${spawned.constructor.name} with id #${spawned.id}`;
		}, 3),
		'data get': new Command(({ executor }, selector, path = '') => {
			let node = executor.level.getNodeBySelector(selector);
			let data = node.getByString(path),
				output = data;
			if (typeof data == 'object' || typeof data == 'function') {
				output = {};
				for (let p of Object.getOwnPropertyNames(data)) {
					output[p] = data[p];
				}
			}
			return `Data of entity #${node.id}: ${output}`;
		}, 3),
		'data set': new Command(({ executor }, selector, path, value) => {
			let node = executor.level.getNodeBySelector(selector);
			node.setByString(path, eval?.(value));
		}, 3),
		/**
		 * @todo implement executor position as default
		 */
		tp: new Command(({ executor }, selector, x, y, z) => {
			let nodes = executor.level.getNodesBySelector(selector),
				location = new Vector3(+x || 0, +y || 0, +z || 0);
			nodes.forEach(entity => {
				entity.position = location;
			});
			return `Teleported ${nodes.length} to ${location.display()}`;
		}, 3),
	})
);

export const execCommandString = (string, data, ignoreOp) => {
	for (let [name, command] of commands) {
		if (!string.startsWith(name)) {
			continue;
		}

		if (data.executor?.oplvl < command.oplvl && !ignoreOp) {
			return 'You do not have permission to execute that command';
		}

		const args = string
			.slice(name.length)
			.split(/\s/)
			.filter(a => a);

		return command.exec(args, data);
	}
};
