import Player from '../core/entities/Player.js';

export class Client extends Player {
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

export class ClientStore extends Map {

	constructor(){
		super()
	}

	getBy(attr, val){
		for(let client of this.values()){
			if(client[attr] == val){
				return client;
			}
		}
	}

	getByID(id){
		return this.getBy('id', id);
	}

	getByName(name){
		return this.getBy('username', name);
	}
}