import { random } from '../utils.js';
import Entity from './Entity.js';
import Hardpoint from '../Hardpoint.js';
import StorageData from '../StorageData.js';

import { Vector3 } from '../../../node_modules/@babylonjs/core/Maths/math.vector.js';

const Ship = class extends Entity {
	constructor(className, owner, level) {
		if (className && !Ship.generic.has(className)) throw new ReferenceError(`Ship type ${className} does not exist`);
		super(className, owner, level ?? owner.getScene());
		let x = random.int(0, owner.power),
			distance = Math.log(x ** 3 + 1);
		this._generic = Ship.generic.get(className);
		Object.assign(this, {
			position: owner.position.add(random.cords(distance, true)), // Will be changed to shipyard location
			storage: new StorageData(Ship.generic.get(className).storage),
			class: className,
			hp: this._generic.hp,
			reload: this._generic.reload,
			jumpCooldown: this._generic.jumpCooldown,
			hardpoints: [],
		});
		for (let generic of this._generic.hardpoints) {
			if (!Hardpoint.generic.has(generic.type)) {
				console.warn(`Hardpoint type ${generic.type} doesn't exist, skipping`);
				continue;
			}

			let hp = new Hardpoint(generic, this);
			this.hardpoints.push(hp);
		}
		if (owner?.fleet instanceof Array) {
			owner.fleet.push(this);
		}
	}
	remove() {
		this.dispose();
		this.owner.fleet.splice(this.owner.fleet.indexOf(this), 1);
		this.getScene().entities.delete(this.id);
	}
	jump(location) {
		if (!(location instanceof Vector3)) throw new TypeError('Location is not a Vector3');
		if (this.jumpCooldown > 0) return 'Hyperspace still on cooldown';
		if (Vector3.Distance(this.position, location) > this._generic.jumpRange) return 'Target location out of range';

		this.position = location.clone();
		this.jumpCooldown = this._generic.jumpCooldown;
	}
	serialize() {
		return {
			position: this.position.asArray().map(num => +num.toFixed(3)),
			rotation: this.rotation.asArray().map(num => +num.toFixed(3)),
			owner: this.owner?.id,
			id: this.id,
			name: this.name,
			class: this.class,
			type: 'ship',
			hp: +this.hp.toFixed(3),
			storage: this.storage.serialize().items,
		};
	}
	static generic = new Map([
		[
			'wind',
			{
				hp: 10,
				speed: 2,
				agility: 2,
				jumpRange: 10000,
				jumpCooldown: 30,
				power: 1,
				enemy: true,
				camRadius: 10,
				xp: 5,
				storage: 100,
				recipe: { metal: 1000, minerals: 500, fuel: 250 },
				requires: {},
				model: 'models/wind.glb',
				hardpoints: [{ type: 'laser', position: new Vector3(0, 0.01, 0.05), scale: 0.25 }],
			},
		],
		[
			'mosquito',
			{
				hp: 25,
				speed: 1,
				agility: 1.5,
				jumpRange: 10000,
				jumpCooldown: 40,
				power: 2,
				enemy: true,
				camRadius: 15,
				xp: 7.5,
				storage: 250,
				recipe: { metal: 2000, minerals: 2000, fuel: 500 },
				requires: {},
				model: 'models/mosquito.glb',
				hardpoints: [
					{ type: 'laser', position: new Vector3(-0.025, 0.0075, -0.075), scale: 0.375 },
					{ type: 'laser', position: new Vector3(0.025, 0.0075, -0.075), scale: 0.375 },
				],
			},
		],
		[
			'cillus',
			{
				hp: 5,
				speed: 1,
				agility: 0.75,
				jumpRange: 10000,
				jumpCooldown: 50,
				power: 1,
				enemy: false,
				camRadius: 20,
				xp: 10,
				storage: 25000,
				recipe: { metal: 5000, minerals: 1000, fuel: 2500 },
				requires: { storage: 3 },
				model: 'models/cillus.glb',
				hardpoints: [],
			},
		],
		[
			'inca',
			{
				hp: 50,
				speed: 1,
				agility: 1,
				jumpRange: 10000,
				jumpCooldown: 45,
				power: 5,
				enemy: true,
				camRadius: 20,
				xp: 10,
				storage: 250,
				recipe: { metal: 4000, minerals: 1000, fuel: 1000 },
				requires: {},
				model: 'models/inca.glb',
				hardpoints: [
					{ type: 'laser', position: new Vector3(-0.06, 0.03, -0.1), scale: 0.75 },
					{ type: 'laser', position: new Vector3(0.06, 0.03, -0.1), scale: 0.75 },
					{ type: 'laser', position: new Vector3(0.06, 0.015, 0.05), scale: 0.75 },
					{ type: 'laser', position: new Vector3(-0.06, 0.015, 0.05), scale: 0.75 },
				],
			},
		],
		[
			'pilsung',
			{
				hp: 100,
				speed: 1,
				agility: 1,
				jumpRange: 10000,
				jumpCooldown: 45,
				power: 10,
				enemy: true,
				camRadius: 30,
				xp: 20,
				storage: 1000,
				recipe: { metal: 10000, minerals: 4000, fuel: 2500 },
				requires: {},
				model: 'models/pilsung.glb',
				hardpoints: [
					{ type: 'laser', position: new Vector3(0.1, 0.04, -0.1), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.8 },
					{ type: 'laser', position: new Vector3(0.1, 0.04, -0.05), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.8 },
					{ type: 'laser', position: new Vector3(0.1, 0.04, 0), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.8 },
					{ type: 'laser', position: new Vector3(0.1, 0.04, 0.05), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.8 },
					{ type: 'laser', position: new Vector3(-0.1, 0.04, -0.1), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.8 },
					{ type: 'laser', position: new Vector3(-0.1, 0.04, -0.05), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.8 },
					{ type: 'laser', position: new Vector3(-0.1, 0.04, 0), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.8 },
					{ type: 'laser', position: new Vector3(-0.1, 0.04, 0.05), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.8 },
				],
			},
		],
		[
			'apis',
			{
				hp: 50,
				speed: 2 / 3,
				agility: 0.5,
				jumpRange: 10000,
				jumpCooldown: 60,
				power: 10,
				enemy: false,
				camRadius: 50,
				xp: 10,
				storage: 100000,
				recipe: { metal: 10000, minerals: 2000, fuel: 5000 },
				requires: { storage: 5 },
				model: 'models/apis.glb',
				hardpoints: [],
			},
		],
		[
			'hurricane',
			{
				hp: 250,
				speed: 2 / 3,
				agility: 1,
				jumpRange: 10000,
				jumpCooldown: 45,
				power: 25,
				enemy: true,
				camRadius: 40,
				xp: 50,
				storage: 2500,
				recipe: { metal: 25000, minerals: 10000, fuel: 5000 },
				requires: {},
				model: 'models/hurricane.glb',
				hardpoints: [
					{ type: 'laser', position: new Vector3(0.325, 0.0375, -1.225), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.85 },
					{ type: 'laser', position: new Vector3(0.325, 0.0375, -1.15), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.85 },
					{ type: 'laser', position: new Vector3(0.325, 0.0375, -1.075), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.85 },
					{ type: 'laser', position: new Vector3(-0.325, 0.0375, -1.225), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.85 },
					{ type: 'laser', position: new Vector3(-0.325, 0.0375, -1.15), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.85 },
					{ type: 'laser', position: new Vector3(-0.325, 0.0375, -1.075), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.85 },
					{ type: 'laser', position: new Vector3(0.1, 0.03, -0.35), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.75 },
					{ type: 'laser', position: new Vector3(0.1, 0.03, -0.2875), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.75 },
					{ type: 'laser', position: new Vector3(0.1, 0.03, -0.225), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.75 },
					{ type: 'laser', position: new Vector3(0.1, 0.03, -0.1625), rotation: new Vector3(0, Math.PI / 2, 0), scale: 0.75 },
					{ type: 'laser', position: new Vector3(-0.1, 0.03, -0.35), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.75 },
					{ type: 'laser', position: new Vector3(-0.1, 0.03, -0.2875), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.75 },
					{ type: 'laser', position: new Vector3(-0.1, 0.03, -0.225), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.75 },
					{ type: 'laser', position: new Vector3(-0.1, 0.03, -0.1625), rotation: new Vector3(0, -Math.PI / 2, 0), scale: 0.75 },
				],
			},
		],
		[
			'horizon',
			{
				hp: 2000,
				speed: 1 / 3,
				agility: 1,
				jumpRange: 10000,
				jumpCooldown: 60,
				power: 100,
				enemy: true,
				camRadius: 65,
				xp: 100,
				storage: 10000,
				recipe: { metal: 1000000, minerals: 500000, fuel: 250000 },
				requires: { build: 5 },
				model: 'models/horizon.glb',
				hardpoints: [
					{ type: 'laser', position: new Vector3(2.125, 0.055, -0.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(2, 0.055, 0), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(1.875, 0.055, 0.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(1.75, 0.055, 1), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(1.625, 0.055, 1.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(1.5, 0.055, 2), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(1.375, 0.055, 2.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(1.25, 0.055, 3), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(1.125, 0.055, 3.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(1, 0.055, 4), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(0.875, 0.055, 4.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(0.75, 0.055, 5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(0.625, 0.055, 5.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(0.5, 0.055, 6), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(0.375, 0.055, 6.5), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(0.25, 0.055, 7), rotation: new Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },

					{ type: 'laser', position: new Vector3(-2.125, 0.055, -0.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(-2, 0.055, 0), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(-1.875, 0.055, 0.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(-1.75, 0.055, 1), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(-1.625, 0.055, 1.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(-1.5, 0.055, 2), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(-1.375, 0.055, 2.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(-1.25, 0.055, 3), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(-1.125, 0.055, 3.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(-1, 0.055, 4), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(-0.875, 0.055, 4.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(-0.75, 0.055, 5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(-0.625, 0.055, 5.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(-0.5, 0.055, 6), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(-0.375, 0.055, 6.5), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new Vector3(-0.25, 0.055, 7), rotation: new Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
				],
			},
		],
	]);
	static FromData(data, owner, level) {
		const ship = new this(data.class, owner, level);
		Object.assign(ship, {
			id: data.id,
			class: data.class,
			position: Vector3.FromArray(data.position),
			rotation: Vector3.FromArray(data.rotation),
			storage: new StorageData(Ship.generic.get(data.class).storage, data.storage),
			hp: +data.hp,
			reload: +data.reload,
			jumpCooldown: +data.jumpCooldown,
		});
	}
};

export default Ship;
