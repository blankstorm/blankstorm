import { filterObject } from './utils.js';
import Items from './items.js';
import Tech from './tech.js';
import { config } from './meta.js';

import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera.js';

export default class extends TransformNode {
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
	get totalItems() {
		return this.fleet.reduce((total, ship) => total + ship.storage.total, 0);
	}
	get maxItems() {
		return this.fleet.reduce((total, ship) => total + ship.storage.max * (1 + this.tech.storage / 20), 0);
	}
	shipNum(type) {
		return this.fleet.reduce((total, ship) => (total + ship.class == type ? 1 : 0), 0);
	}
	tech = Object.fromEntries([...Tech.keys()].map(item => [item, 0]));
	fleet = [];
	xp = 0;
	xpPoints = 0;
	velocity = Vector3.Zero();
	speed = 1;
	get power() {
		return this.fleet.reduce((a, ship) => a + (ship._generic.power || 0), 0);
	}
	constructor(data, level) {
		//if (!(level instanceof Level) && level) throw new TypeError('passed level not a Level'); Level not imported due to overhead
		super(data.name, level);
		this.cam = new ArcRotateCamera(data.name, -Math.PI / 2, Math.PI / 2, 5, Vector3.Zero(), level);
		Object.assign(this.cam, config.playerCamera);
		this.cam.target = this.position;
		Object.assign(this, data);
	}
	serialize() {
		return {
			position: this.position.asArray().map(num => +num.toFixed(3)),
			rotation: this.rotation.asArray().map(num => +num.toFixed(3)),
			fleet: this.fleet.map(s => s.id),
			...filterObject(this, 'tech', 'items', 'xp', 'xpPoints'),
		};
	}
	addVelocity(vector = Vector3.Zero(), computeMultiplyer) {
		let direction = this.cam.getDirection(vector).scale(1 / Math.PI);
		direction.y = 0;
		direction.normalize();
		if (computeMultiplyer) direction.scaleInPlace(this.speed + this.tech.thrust / 10);
		this.velocity.addInPlace(direction);
	}
}
