import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { isJSON } from 'utilium';
import type { Entity } from './entities/entity';
import type { Player } from './entities/player';
import { Ship } from './entities/ship';
import { game_url } from './metadata';
import type { ShipType } from './generic/ships';

export interface CommandExecutionContext {
	executor: Entity & { oplvl?: number };
}

export interface Command {
	exec(context: CommandExecutionContext, ...args: string[]): string | void;
	oplvl: number;
}

export const commands: Map<string, Command> = new Map(
	Object.entries({
		help: {
			exec() {
				return `See ${game_url}/docs/commands for command documentation`;
			},
			oplvl: 0,
		},
		remove: {
			exec({ executor }, selector) {
				const entities = executor.level.selectEntities(selector);
				for (const entity of entities) {
					entity.remove();
				}
				return `Removed ${entities.size} entities`;
			},
			oplvl: 3,
		},
		spawn: {
			exec({ executor }, type: ShipType, selector, extra) {
				const parent: Player = executor.level.entity(selector);
				const spawned = new Ship(undefined, executor.level, type);
				spawned.parent = spawned.owner = parent;
				if (isJSON(extra)) {
					//spawned.update(JSON.parse(extra));
				}
				return `Spawned ${spawned.constructor.name} with id #${spawned.id}`;
			},
			oplvl: 3,
		},
		/**
		 * @todo implement executor position as default
		 */
		tp: {
			exec({ executor }, selector, x, y, z) {
				const entities = executor.level.selectEntities(selector),
					location = new Vector3(+x || 0, +y || 0, +z || 0);
				entities.forEach(entity => {
					entity.position = location;
				});
				return 'Teleported ' + entities.size;
			},
			oplvl: 3,
		},
	})
);

export const execCommandString = (string: string, context: CommandExecutionContext, ignoreOp?: boolean): string | void => {
	context.executor.oplvl ??= 0;
	for (const [name, command] of commands) {
		if (!string.startsWith(name)) {
			continue;
		}

		if (context.executor.oplvl < command.oplvl && !ignoreOp) {
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
