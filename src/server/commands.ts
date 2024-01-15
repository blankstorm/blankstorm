import { getAccount } from '@blankstorm/api';
import { Command, CommandExecutionContext, commands as _commands, execCommandString as _execCommandString } from '../core/commands';
import { Client } from './Client';
import type { Server } from './Server';

export interface ServerCommandExecutionContext extends CommandExecutionContext {
	executor: Client;
	server: Server;
}

export interface ServerCommand extends Command {
	exec({ server, executor }: { server: Server; executor: Client }, ...args): string | void;
}

export const commands: Map<string, Partial<ServerCommand>> = new Map([..._commands.entries()]);
commands.set('kick', {
	exec({ server, executor }, player, ...reason: string[]) {
		const client = server.clients.getByName(player);
		if (!client) {
			return 'Player is not online or does not exist';
		}
		client.kick(reason.join(' '));
		server.log.log(`${executor.name} kicked ${player}. Reason: ${reason.join(' ')}`);
		return 'Kicked ' + player;
	},
	oplvl: 3,
} as ServerCommand);
commands.set('ban', {
	exec({ server, executor }, player, ...reason: string[]) {
		const client = server.clients.getByName(player);
		if (!client) {
			return 'Player is not online or does not exist';
		}
		client.ban(reason.join(' '));
		server.log.log(`${executor.name} banned ${player}. Reason: ${reason.join(' ')}`);
		return 'Banned ' + player;
	},
	oplvl: 4,
});
commands.set('unban', {
	exec({ server, executor }, player, ...reason) {
		getAccount('username', player)
			.then(client => {
				server.blacklist.splice(server.blacklist.indexOf(client.id), 1);
				server.log.log(`${executor.name} unbanned ${player}. Reason: ${reason.join(' ')}`);
				executor.socket.emit('chat', `Unbanned ${player}`);
			})
			.catch(() => {
				executor.socket.emit('chat', 'Player is not online or does not exist');
			});
	},
	oplvl: 4,
});
commands.set('log', {
	exec({ server, executor }, ...message) {
		server.log.log(`${executor.name} logged ${message.join(' ')}`);
	},
	oplvl: 1,
});
commands.set('msg', {
	exec({ server, executor }, player, ...message) {
		if (server.clients.getByName(player) instanceof Client) {
			server.clients.getByName(player).socket.emit(`[${executor.name} -> me] ${message.join(' ')}`);
			server.log.log(`[${executor.name} -> ${player}] ${message.join(' ')}`);
			server.clients.getByName(player).lastMessager = executor;
			return `[me -> ${executor.name}] ${message.join(' ')}`;
		} else {
			return 'That user is not online';
		}
	},
	oplvl: 0,
});
commands.set('reply', {
	exec({ server, executor }, ...message) {
		return executor.lastMessager ? commands.get('msg').exec({ server, executor }, [executor.lastMessager.name, ...message]) : 'No one messaged you yet =(';
	},
	oplvl: 0,
});
commands.set('stop', {
	exec({ server }) {
		server.stop();
	},
	oplvl: 4,
});
commands.set('restart', {
	exec({ server }) {
		server.restart();
	},
	oplvl: 4,
});
commands.set('save', {
	exec({ server }) {
		server.save();
		return 'Saved the current level';
	},
	oplvl: 4,
});
export function execCommandString(string: string, context: ServerCommandExecutionContext, ignoreOp?: boolean) {
	return _execCommandString(string, context, ignoreOp);
}
