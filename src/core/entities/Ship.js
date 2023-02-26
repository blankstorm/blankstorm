import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import { random } from '../utils.js';
import Entity from './Entity.js';
import Hardpoint from './Hardpoint.js';
import StorageData from '../StorageData.js';
import generic from './ships.js';

export default class Ship extends Entity {
	hardpoints = [];

	isTargetable = true;

	constructor({ id, name, position, rotation, parent, owner, level, storage, hp, reload, jumpCooldown, type, hardpoints = [] }) {
		if (type && !Ship.generic.has(type)) throw new ReferenceError(`Ship type ${type} does not exist`);
		super({ id, name, position, rotation, parent, owner, level });

		let distance = Math.log(random.int(0, owner?.power || 1) ** 3 + 1); //IMPORTANT TODO: Move to ship creation
		this.position.addInPlace(random.cords(distance, true));

		this._generic = Ship.generic.get(type);

		Object.assign(this, {
			type: type,
			storage: storage instanceof StorageData ? storage : new StorageData(this._generic.storage),
			hp: hp ?? this._generic.hp,
			reload: reload ?? this._generic.reload,
			jumpCooldown: jumpCooldown ?? this._generic.jumpCooldown,
		});

		this._generic.hardpoints.forEach((generic, i) => {
			if (!Hardpoint.generic.has(generic.type)) {
				console.warn(`Hardpoint type ${generic.type} doesn't exist, skipping`);
				return;
			}

			let hp = hardpoints[i] ? Hardpoint.FromData(hardpoints[i], level) : new Hardpoint({ ...generic, owner: this, level });
			hp.info = generic;
			this.hardpoints.push(hp);
		});

		if (owner?.fleet instanceof Array) {
			owner.fleet.push(this);
		}
	}

	remove() {
		super.remove();
		this.owner.fleet.splice(this.owner.fleet.indexOf(this), 1);
	}

	jump(location) {
		if (!(location instanceof Vector3)) throw new TypeError('Location is not a Vector3');
		if (this.jumpCooldown > 0) return 'Hyperspace still on cooldown';
		if (Vector3.Distance(this.position, location) > this._generic.jumpRange) return 'Target location out of range';

		this.position = location.clone();
		this.jumpCooldown = this._generic.jumpCooldown;
	}

	serialize() {
		return Object.assign(super.serialize(), {
			type: this.type,
			hp: +this.hp.toFixed(3),
			jumpCooldown: +this.jumpCooldown.toFixed(3),
			storage: this.storage.serialize().items,
			hardpoints: this.hardpoints.map(hp => hp.serialize()),
		});
	}

	static FromData(data, level) {
		const max = this.generic.get(data.type).storage;
		const parent = level.getNodeByID(data.owner);
		return new this({
			id: data.id,
			type: data.type,
			parent,
			owner: parent,
			position: Vector3.FromArray(data.position || [0, 0, 0]),
			rotation: Vector3.FromArray(data.rotation || [0, 0, 0]),
			storage: StorageData.FromData({ ...data.storage, max }),
			hp: +data.hp || 0,
			reload: +data.reload || 0,
			jumpCooldown: +data.jumpCooldown || 0,
			hardpoints: data.hardpoints || [],
			level,
		});
	}

	static generic = generic;
}
