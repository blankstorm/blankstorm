import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import Items from '../items.js';
import Tech from '../tech.js';
import Entity from './Entity.js';
import Ship from './Ship.js';

export default class Player extends Entity {
	tech = Object.fromEntries([...Tech.keys()].map(item => [item, 0]));
	fleet = [];
	xp = 0;
	xpPoints = 0;
	speed = 1;
	get power() {
		return this.fleet.reduce((a, ship) => a + (ship._generic.power || 0), 0);
	}

	constructor({ id, name, position, rotation, level, fleet = [] }) {
		super({ id, name, position, rotation, level });

		for (let shipData of fleet) {
			if (shipData instanceof Ship) {
				this.fleet.push(shipData);
			} else {
				const ship = Ship.FromData({ ...shipData, owner: this.id }, level);
				this.fleet.push(ship);
			}
		}
	}

	get items() {
		let items = Object.fromEntries([...Items.keys()].map(i => [i, 0]));
		this.fleet.forEach(ship => {
			for (let [name, amount] of Object.entries(items)) {
				items[name] = +ship.storage.get(name) + amount;
			}
		});
		return items;
	}

	set items(value) {
		this.fleet.forEach(ship => {
			ship.storage.empty(Object.keys(value));
		});
		this.addItems(value);
	}

	get totalItems() {
		return this.fleet.reduce((total, ship) => total + ship.storage.total, 0);
	}

	get maxItems() {
		return this.fleet.reduce((total, ship) => total + ship.storage.max * (1 + this.tech.storage / 20), 0);
	}

	shipNum(type) {
		return this.fleet.reduce((total, ship) => (total + ship.class == type ? 1 : 0), 0);
	}

	addItems(items) {
		this.fleet.forEach(ship => {
			let space = ship.storage.max * (1 + this.tech.storage / 20) - ship.storage.total;
			if (space > 0) {
				Object.entries(items).forEach(([name, amount]) => {
					if (Items.has(name)) {
						let stored = Math.min(space, amount);
						ship.storage.add(name, stored);
						items[name] -= stored;
						space -= stored;
					} else {
						console.warn(`Failed to add ${amount} ${name} to player items: Invalid item`);
					}
				});
			}
		});
	}

	removeItems(items) {
		items = { ...items };
		this.fleet.forEach(ship => {
			Object.entries(items).forEach(([item, amount]) => {
				let stored = Math.min(ship.storage.get(item), amount);
				ship.storage.remove(item, stored);
				items[item] -= stored;
			});
		});
	}

	removeAllItems() {
		this.removeItems(Object.fromEntries([...Items.keys()].map(i => [i, Infinity])));
	}

	hasItems(items) {
		items = { ...items };
		this.fleet.forEach(ship => {
			Object.entries(items).forEach(([item, amount]) => {
				let stored = Math.min(ship.storage.get(item), amount);
				items[item] -= stored;
			});
		});
		return Object.values(items).every(item => item <= 0);
	}

	addVelocity(vector = Vector3.Zero(), computeMultiplyer) {
		let direction = this.cam.getDirection(vector).scale(1 / Math.PI);
		direction.y = 0;
		direction.normalize();
		if (computeMultiplyer) direction.scaleInPlace(this.speed + this.tech.thrust / 10);
		this.velocity.addInPlace(direction);
	}

	serialize() {
		return Object.assign(super.serialize(), {
			fleet: this.fleet.map(ship => ship.id),
		});
	}

	static FromData(data, level) {
		const fleet = (data.fleet || []).map(shipData => (shipData instanceof Ship ? Ship : level.entities.get(shipData)));
		return new this({
			id: data.id,
			name: data.name,
			position: Vector3.FromArray(data.position),
			rotation: Vector3.FromArray(data.rotation),
			fleet,
			level,
		});
	}
}
