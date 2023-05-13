import Player from '../core/entities/Player.js';

export class Client extends Player {
	constructor(id, server, { fleet, socket }) {
		super(id, server.level, { fleet });
		this.server = server;
		this.socket = socket;
	}

	kick(message) {
		this.socket.emit('kick', message);
		this.socket.disconnect(true);
	}

	ban(message) {
		this.kick(`You have been banned from this server: ${message}`);
		this.server.blacklist.push(this.id);
	}

	serialize() {
		return Object.assign(super.serialize(), { node_type: 'player' });
	}

	static GetDisconnectReason(reason) {
		let reasons = new Map([
			['server namespace disconnect', 'Disconnected by server'],
			['client namespace disconnect', 'Client disconnected'],
			['ping timeout', 'Connection timed out'],
			['transport close', 'Lost Connection'],
			['transport error', 'Connection failed'],
		]);
		return reasons.has(reason) ? reasons.get(reason) : reason;
	}
}

export class ClientStore extends Map {
	constructor() {
		super();
	}

	getBy(attr, val) {
		for (let client of this.values()) {
			if (client[attr] == val) {
				return client;
			}
		}
	}

	getByID(id) {
		return this.getBy('id', id);
	}

	getByName(name) {
		return this.getBy('name', name);
	}
}
