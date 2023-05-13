import { Command, commands, execCommandString } from '../core/commands.js';
import { requestUserInfo } from '../core/api.js';
import { Client } from './Client.js';

commands.set(
	'kick',
	new Command(({ server, executor }, player, ...reason) => {
		const client = server.clients.getByName(player);
		if (!client) {
			return 'Player is not online or does not exist';
		}
		client.kick(reason);
		server.log.addMessage(`${executor.name} kicked ${player}. Reason: ${reason.join(' ')}`);
		return 'Kicked ' + player;
	}, 3)
);
commands.set(
	'ban',
	new Command(({ server, executor }, player, ...reason) => {
		const client = server.clients.getByName(player);
		if (!client) {
			return 'Player is not online or does not exist';
		}
		client.ban(reason);
		server.log.addMessage(`${executor.name} banned ${player}. Reason: ${reason.join(' ')}`);
		return 'Banned ' + player;
	}, 4)
);
commands.set(
	'unban',
	new Command(({ server, executor }, player, ...reason) => {
		requestUserInfo('name', player)
			.then(client => {
				server.blacklist.splice(server.blacklist.indexOf(client.id), 1);
				server.log.addMessage(`${executor.name} unbanned ${player}. Reason: ${reason.join(' ')}`);
				executor.socket.emit('chat', `Unbanned ${player}`);
			})
			.catch(() => {
				executor.socket.emit('chat', 'Player is not online or does not exist');
			});
	}, 4)
);
commands.set(
	'log',
	new Command(({ server, executor }, ...message) => {
		server.log.addMessage(`${executor.name} logged ${message.join(' ')}`);
	}, 1)
);
commands.set(
	'msg',
	new Command(({ server, executor }, player, ...message) => {
		if (server.clients.getByName(player) instanceof Client) {
			server.clients.getByName(player).socket.emit(`[${executor.name} -> me] ${message.join(' ')}`);
			server.log.addMessage(`[${executor.name} -> ${player}] ${message.join(' ')}`);
			server.clients.getByName(player).lastMessager = executor;
			return `[me -> ${executor.name}] ${message.join(' ')}`;
		} else {
			return 'That user is not online';
		}
	}, 0)
);
commands.set(
	'reply',
	new Command(({ executor }, ...message) => {
		return executor.lastMessager ? commands.msg.run(executor, [executor.lastMessager.name, ...message]) : 'No one messaged you yet =(';
	}, 0)
);
commands.set(
	'stop',
	new Command(({ server }) => {
		server.stop();
	}, 4)
);
commands.set(
	'restart',
	new Command(({ server }) => {
		server.restart();
	}, 4)
);
commands.set(
	'save',
	new Command(({ server }) => {
		server.save();
		return 'Saved the current level';
	}, 4)
);
export { commands, execCommandString };
