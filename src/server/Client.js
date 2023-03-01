import Player from '../core/entities/Player.js';

export default class Client extends Player {
	constructor(id, level, { fleet, socket }) {
		super(id, level, { fleet });
		this.socket = socket;
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
