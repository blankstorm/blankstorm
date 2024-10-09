import { getAccount } from '@blankstorm/api';
import type { Command, CommandExecutionContext } from '../core/commands.js';
import { commands as _commands, execCommandString as _execCommandString } from '../core/commands.js';
import { Client } from './clients.js';
import * as server from './server.js';
import { blacklist } from './config.js';
import { getClientByName } from './clients.js';
import { logger } from './utils.js';

export interface ServerCommandExecutionContext extends CommandExecutionContext {
	executor: Client;
}

export interface ServerCommand extends Command {
	exec(context: ServerCommandExecutionContext, ...args: string[]): string | void;
}

export const commands: Map<string, ServerCommand> = new Map([..._commands.entries()]);
commands.set('kick', {
	exec({ executor }, player, ...reason: string[]) {
		const client = getClientByName(player);
		if (!client) {
			return 'Player is not online or does not exist';
		}
		client.kick(reason.join(' '));
		logger.log(`${executor.name} kicked ${player}. Reason: ${reason.join(' ')}`);
		return 'Kicked ' + player;
	},
	permissionLevel: 3,
} as ServerCommand);
commands.set('ban', {
	exec({ executor }, player, ...reason: string[]) {
		const client = getClientByName(player);
		if (!client) {
			return 'Player is not online or does not exist';
		}
		client.ban(reason.join(' '));
		logger.log(`${executor.name} banned ${player}. Reason: ${reason.join(' ')}`);
		return 'Banned ' + player;
	},
	permissionLevel: 4,
});
commands.set('unban', {
	exec({ executor }, player, ...reason) {
		getAccount('username', player)
			.then(client => {
				blacklist.delete(client.id);
				logger.log(`${executor.name} unbanned ${player}. Reason: ${reason.join(' ')}`);
				executor.socket.emit('chat', `Unbanned ${player}`);
			})
			.catch(() => {
				executor.socket.emit('chat', 'Player is not online or does not exist');
			});
	},
	permissionLevel: 4,
});
commands.set('log', {
	exec({ executor }, ...message) {
		logger.log(`${executor.name} logged ${message.join(' ')}`);
	},
	permissionLevel: 1,
});
commands.set('msg', {
	exec({ executor }, player, ...message) {
		if (!(getClientByName(player) instanceof Client)) {
			return 'That user is not online';
		}
		getClientByName(player).socket.emit(`[${executor.name} -> me] ${message.join(' ')}`);
		logger.log(`[${executor.name} -> ${player}] ${message.join(' ')}`);
		getClientByName(player).lastMessager = executor;
		return `[me -> ${executor.name}] ${message.join(' ')}`;
	},
	permissionLevel: 0,
});
commands.set('reply', {
	exec({ executor }, ...message) {
		return executor.lastMessager ? commands.get('msg')!.exec({ executor }, executor.lastMessager.name, ...message) : 'No one messaged you yet =(';
	},
	permissionLevel: 0,
});
commands.set('stop', {
	exec() {
		server.stop();
	},
	permissionLevel: 4,
});
commands.set('restart', {
	exec() {
		server.restart();
	},
	permissionLevel: 4,
});
commands.set('save', {
	exec() {
		server.save();
		return 'Saved the current level';
	},
	permissionLevel: 4,
});
export function execCommandString(string: string, context: ServerCommandExecutionContext, ignoreOp?: boolean) {
	return _execCommandString(string, context, ignoreOp);
}
