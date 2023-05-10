import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import { random } from '../utils.js';
import Entity from './Entity.js';
import Hardpoint from './Hardpoint.js';
import Storage from '../Storage.js';
import generic from './ships.js';

export default class Ship extends Entity {
	hardpoints = [];
	type;
	storage;
	reload;
	jumpCooldown;

	isTargetable = true;

	constructor(id, level, { storage, hp, reload, jumpCooldown, type, hardpoints = [], power }) {
		if (type && !Ship.generic.has(type)) throw new ReferenceError(`Ship type ${type} does not exist`);
		super(id, level);

		let distance = Math.log(random.int(0, power || 1) ** 3 + 1); //IMPORTANT TODO: Move to ship creation
		this.position.addInPlace(random.cords(distance, true));

		this.type = type;
		this.storage = storage instanceof Storage ? storage : new Storage(this.generic.storage);
		this.hp = hp ?? this.generic.hp;
		this.reload = reload ?? this.generic.reload;
		this.jumpCooldown = jumpCooldown ?? this.generic.jumpCooldown;

		this.generic.hardpoints.forEach((generic, i) => {
			if (!Hardpoint.generic.has(generic.type)) {
				console.warn(`Hardpoint type ${generic.type} doesn't exist, skipping`);
				return;
			}

			let hp = hardpoints[i] ? Hardpoint.FromData(hardpoints[i], level) : new Hardpoint(null, level, generic);
			hp.parent = hp.owner = this;
			hp.info = generic;
			this.hardpoints.push(hp);
		});
	}

	get generic() {
		return Ship.generic.get(this.type);
	}

	remove() {
		super.remove();
		this.owner.fleet.splice(this.owner.fleet.indexOf(this), 1);
	}

	jump(location) {
		if (!(location instanceof Vector3)) throw new TypeError('Location is not a Vector3');
		if (this.jumpCooldown > 0) return 'Hyperspace still on cooldown';
		if (Vector3.Distance(this.position, location) > this.generic.jumpRange) return 'Target location out of range';

		this.position = location.clone();
		this.jumpCooldown = this.generic.jumpCooldown;
	}

	serialize() {
		return Object.assign(super.serialize(), {
			type: this.type,
			hp: +this.hp.toFixed(3),
			jumpCooldown: +this.jumpCooldown.toFixed(),
			storage: this.storage.serialize().items,
			hardpoints: this.hardpoints.map(hp => hp.serialize()),
		});
	}

	static FromData(data, level) {
		const max = this.generic.get(data.type).storage;
		return super.FromData(data, level, { ...data, storage: Storage.FromData({ ...data.storage, max }) });
	}

	static generic = generic;
}
