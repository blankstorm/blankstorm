import { Vector3 } from '@babylonjs/core/Maths/math.vector';

import { Ship } from './nodes/Ship';
import { SHORT_URL } from './metadata';
import type { Player } from './nodes/Player';
import { isJSON } from './utils';

export interface CommandExecutionContext {
	executor: Player;
}

export interface Command {
	exec(context: CommandExecutionContext, ...args): string | void;
	oplvl: number;
}

export const commands: Map<string, Partial<Command>> = new Map(
	Object.entries({
		help: {
			exec() {
				return `See ${SHORT_URL}/docs/commands for command documentation`;
			},
			oplvl: 0,
		},
		kill: {
			exec({ executor }, selector) {
				const entities = executor.system.getNodesBySelector(selector).filter(node => node.nodeTypes.includes('entitiy'));
				entities.forEach(e => e.remove());
				return `killed ${entities.length} entities`;
			},
			oplvl: 3,
		},
		spawn: {
			exec({ executor }, type, selector, extra) {
				const parent = executor.system.getNodeBySelector(selector);
				const spawned = new Ship(null, executor.system, { type, power: executor.power });
				spawned.parent = spawned.owner = parent as Player;
				if (isJSON(extra)) {
					//spawned.update(JSON.parse(extra));
				}
				return `Spawned ${spawned.constructor.name} with id #${spawned.id}`;
			},
			oplvl: 3,
		},
		'data get': {
			/*exec({ executor }, selector, path = '') {
				const node = executor.level.getNodeBySelector(selector);
				const data = node.getByString(path),
					output = data;
				if (typeof data == 'object' || typeof data == 'function') {
					output = {};
					for (let p of Object.getOwnPropertyNames(data)) {
						output[p] = data[p];
					}
				}
				return `Data of entity #${node.id}: ${output}`;
			},*/
			oplvl: 3,
		},
		'data set': {
			/*exec({ executor }, selector, path, value) {
				return 'This command is not implemented';
				let node = executor.level.getNodeBySelector(selector);
				node.setByString(path, eval?.(value));
			},*/
			oplvl: 3,
		},
		/**
		 * @todo implement executor position as default
		 */
		tp: {
			exec({ executor }, selector, x, y, z) {
				const nodes = executor.system.getNodesBySelector(selector),
					location = new Vector3(+x || 0, +y || 0, +z || 0);
				nodes.forEach(entity => {
					entity.position = location;
				});
				return 'Teleported ' + nodes.length;
			},
			oplvl: 3,
		},
	})
);

export const execCommandString = (string: string, context: CommandExecutionContext, ignoreOp?: boolean): string | void => {
	for (const [name, command] of commands) {
		if (!string.startsWith(name)) {
			continue;
		}

		if (context.executor?.oplvl < (command.oplvl || 0) && !ignoreOp) {
			return 'You do not have permission to execute that command';
		}

		const args = string
			.slice(name.length)
			.split(/\s/)
			.filter(a => a);

		if (typeof command.exec != 'function') {
			return 'Command is not implemented';
		}

		return command.exec(context, ...args);
	}

	return 'Command does not exist';
};
