/// <reference path="../node_modules/babylonjs/babylon.d.ts" />
/* global BABYLON */
//core info and setup
export const config = {
	mesh_segments: 32,
	render_quality: 0,
	load_remote_manifest: false,
	playerCamera: {
		wheelPrecision: 5,
		lowerRadiusLimit: 1,
		upperRadiusLimit: 50,
		minZ: 0.1,
		radius: 10,
	},
	settings: {},
};

export const version = 'alpha_1.4.0';
export const versions = new Map([
	['infdev_1', { text: 'Infdev 1', group: 'infdev' }],
	['infdev_2', { text: 'Infdev 2', group: 'infdev' }],
	['infdev_3', { text: 'Infdev 3', group: 'infdev' }],
	['infdev_4', { text: 'Infdev 4', group: 'infdev' }],
	['infdev_5', { text: 'Infdev 5', group: 'infdev' }],
	['infdev_6', { text: 'Infdev 6', group: 'infdev' }],
	['infdev_7', { text: 'Infdev 7', group: 'infdev' }],
	['infdev_8', { text: 'Infdev 8', group: 'infdev' }],
	['infdev_9', { text: 'Infdev 9', group: 'infdev' }],
	['infdev_10', { text: 'Infdev 10', group: 'infdev' }],
	['infdev_11', { text: 'Infdev 11', group: 'infdev' }],
	['infdev_12', { text: 'Infdev 12', group: 'infdev' }],
	['alpha_1.0.0', { text: 'Alpha 1.0.0', group: 'alpha' }],
	['alpha_1.1.0', { text: 'Alpha 1.1.0', group: 'alpha' }],
	['alpha_1.2.0', { text: 'Alpha 1.2.0', group: 'alpha' }],
	['alpha_1.2.1', { text: 'Alpha 1.2.1', group: 'alpha' }],
	['alpha_1.3.0', { text: 'Alpha 1.3.0', group: 'alpha' }],
	['alpha_1.3.1', { text: 'Alpha 1.3.1', group: 'alpha' }],
	['alpha_1.4.0', { text: 'Alpha 1.4.0', group: 'alpha' }],
]);
if (config.load_remote_manifest) {
	fetch('https://blankstorm.drvortex.dev/versions/manifest.json')
		.then(response => response.json())
		.then(data => {
			for (let [key, value] of data) {
				versions.set(key, value);
			}
		})
		.catch(err => console.warn('Failed to retrieve version manifest: ' + err));
}

export const greek = [
	'Alpha',
	'Beta',
	'Gamma',
	'Delta',
	'Epsilon',
	'Zeta',
	'Eta',
	'Theta',
	'Iota',
	'Kappa',
	'Lambda',
	'Mu',
	'Nu',
	'Xi',
	'Omicron',
	'Pi',
	'Rho',
	'Sigma',
	'Tau',
	'Upsilon',
	'Phi',
	'Chi',
	'Psi',
	'Omega',
];
export const range = (min, max) => {
	let a = [];
	for (let i = min; i < max; i++) {
		a.push(i);
	}
	return a;
};

//utility functions
export const isHex = str => /^[0-9a-f-.]+$/.test(str);
export const isJSON = str => {
	try {
		JSON.parse(str);
		return true;
	} catch (e) {
		return false;
	}
};
export const random = {
	float: (min = 0, max = 1) => Math.random() * (max - min) + min,
	hex: (length = 1) => {
		let s = '';
		for (let i = 0; i < length; i++) {
			s += Math.floor(Math.random() * 16).toString(16);
		}
		return s;
	},
	get bool() {
		return !!Math.round(Math.random());
	},
	bin: (length = 1) => {
		let b = '';
		for (let i = 0; i < length; i++) {
			b += Math.round(Math.random());
		}
		return b;
	},
	int: (min = 0, max = 1) => Math.round(Math.random() * (max - min) + min),
	cords: (dis = 1, y0) => {
		let angle = Math.random() * Math.PI * 2,
			angle2 = Math.random() * Math.PI * 2;
		return y0
			? new BABYLON.Vector3(dis * Math.cos(angle), 0, dis * Math.sin(angle))
			: new BABYLON.Vector3(dis * Math.cos(angle), dis * Math.sin(angle) * Math.cos(angle2), dis * Math.sin(angle) * Math.sin(angle2));
	},
};
export const generate = {
	enemies: power => {
		//enemy spawning algorithm
		let e = [];
		e.power = power;
		let generic = [...Ship.generic];
		generic.sort((a, b) => b[1].power - a[1].power); //decending
		for (let [name, ship] of generic) {
			for (let j = 0; j < Math.floor(power / ship.power); j++) {
				e.push(name);
				power -= ship.power;
			}
		}
		return e;
	},
	items: (quantity = 0, rares) => {
		let result = {};
		for (let name of Items.keys()) {
			Items.get(name).rare
				? Math.random() < Items.get(name).drop && rares
					? (result[name] = quantity / Items.get(result).value)
					: (result[name] = 0)
				: (result[name] = quantity / Items.get(name).value);
		}
		return result;
	},
};
const wait = time => new Promise(resolve => setTimeout(resolve, time));

//custom stuff
Object.defineProperty(Object.prototype, 'filter', {
	value: function (...keys) {
		return Object.fromEntries(Object.entries(this).filter(([key]) => keys.includes(key)));
	},
});
Object.defineProperty(Array.prototype, 'spliceOut', {
	value: function (element) {
		let i = this.indexOf(element);
		if (i != -1) this.splice(i, 1);
		return i != -1;
	},
});

export const Items = new Map([
	['metal', { rare: false, value: 1 }],
	['minerals', { rare: false, value: 2 }],
	['fuel', { rare: false, value: 4 }],
	['ancient_tech', { rare: true, drop: 0.1, value: 1000 }],
	['code_snippets', { rare: true, drop: 0.1, value: 1000 }],
]);
export const Tech = new Map([
	['armor', { recipe: { metal: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {} }],
	['laser', { recipe: { minerals: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {} }],
	['reload', { recipe: { metal: 4000, minerals: 1500 }, xp: 1, scale: 1.2, max: 10, requires: {} }],
	['thrust', { recipe: { fuel: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {} }],
	['energy', { recipe: { fuel: 5000, minerals: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {} }],
	['shields', { recipe: { metal: 2500, minerals: 5000 }, xp: 1, scale: 1.5, max: 10, requires: { armor: 5 } }],
	['storage', { recipe: { metal: 10000, minerals: 10000, fuel: 10000 }, xp: 2, scale: 10, requires: {} }],
	['missle', { recipe: { metal: 10000, minerals: 1000, fuel: 5000 }, xp: 1, scale: 1.5, max: 25, requires: { laser: 5 } }],
	['regen', { recipe: { metal: 50000, minerals: 10000, fuel: 10000 }, xp: 1, scale: 1.5, max: 25, requires: { reload: 5, armor: 15 } }],
	['build', { recipe: { metal: 100000 }, xp: 2, scale: 1.5, max: 50, requires: { armor: 10, thrust: 10, reload: 10 } }],
	['salvage', { recipe: { metal: 250000, minerals: 50000, fuel: 100000 }, xp: 5, scale: 1.25, max: 25, requires: { build: 5 } }],
]);

Tech.priceOf = (type, level) => {
	let recipe = { ...Tech.get(type).recipe };
	for (let p in Tech.get(type).recipe) {
		for (let i = 1; i < level; i++) {
			recipe[p] *= Tech.get(type).scale;
		}
	}
	return recipe;
};
Tech.isLocked = (type, current) => {
	for (let i in Tech.get(type).requires) {
		if ((Tech.get(type).requires[i] > 0 && current.tech[i] < Tech.get(type).requires[i]) || (Tech.get(type).requires[i] == 0 && current.tech[i] > 0)) {
			return true;
		}
	}
	return false;
};

export const Path = class extends BABYLON.Path3D {
	static Node = class {
		position = BABYLON.Vector3.Zero();
		parent = null;
		constructor(...args) {
			this.position = Path.Node.Round(args[0] instanceof BABYLON.Vector3 ? args[0] : new BABYLON.Vector3(args[0], args[1], args[2]));
			if (args.at(-1) instanceof Path.Node) this.parent = args.at(-1);
		}
		gCost = 0;
		hCost = 0;
		intersects = [];
		heapIndex = null;
		get fCost() {
			return this.gCost + this.hCost;
		}
		equals(node) {
			return this.position.equals(node.position);
		}
		static Round(vector) {
			return new BABYLON.Vector3(Math.round(vector.x), Math.round(vector.y), Math.round(vector.z));
		}
	};
	static nodeDistance(nodeA, nodeB) {
		if (!(nodeA instanceof Path.Node && nodeB instanceof Path.Node)) throw new TypeError('passed nodes must be path.Node');
		let distanceX = Math.abs(nodeA.position.x - nodeB.position.x);
		let distanceY = Math.abs(nodeA.position.z - nodeB.position.z);
		return Math.SQRT2 * (distanceX > distanceY ? distanceY : distanceX) + (distanceX > distanceY ? 1 : -1) * (distanceX - distanceY);
	}
	static trace(startNode, endNode) {
		let path = [],
			currentNode = endNode;
		while (!currentNode.equals(startNode)) {
			path.push(currentNode);
			currentNode = currentNode.parent;
		}
		return path.reverse();
	}
	openNodes = [];
	closedNodes = [];
	startNode = null;
	endNode = null;
	gizmo = null;
	path = [];
	#pathFound = false;
	constructor(start, end, scene) {
		super([]);
		try {
			if (!(start instanceof BABYLON.Vector3)) throw new TypeError('Start must be a Vector');
			if (!(end instanceof BABYLON.Vector3)) throw new TypeError('End must be a Vector');
			this.startNode = new Path.Node(start);
			this.endNode = new Path.Node(end);
			this.openNodes.push(this.startNode);
			while (!this.#pathFound && this.openNodes.length > 0 && this.openNodes.length < 1e4 && this.closedNodes.length < 1e4) {
				let currentNode = this.openNodes.reduce(
					(previous, current) => (previous.fCost < current.fCost || (previous.fCost == current.fCost && previous.hCost > current.hCost) ? previous : current),
					this.openNodes[0]
				);
				this.openNodes.splice(
					this.openNodes.findIndex(node => node == currentNode),
					1
				);
				this.closedNodes.push(currentNode);
				if (currentNode.equals(this.endNode)) {
					this.endNode = currentNode;
					this.path = Path.trace(this.startNode, this.endNode);
					this.#pathFound = true;
				}
				let relatives = [0, 1, -1].flatMap(x => [0, 1, -1].map(y => new BABYLON.Vector3(x, 0, y))).filter(v => v.x != 0 || v.z != 0);
				let neighbors = relatives.map(v =>
					this.openNodes.some(node => node.position.equals(v))
						? this.openNodes.find(node => node.position.equals(v))
						: new Path.Node(currentNode.position.add(v), currentNode)
				);
				for (let neighbor of neighbors) {
					if (scene instanceof Level) {
						scene.bodies.forEach(body => {
							if (BABYLON.Vector3.Distance(body.position, neighbor.position) <= body.radius + 1) neighbor.intersects.push(body);
						});
					}
					if (!neighbor.intersects.length && !this.closedNodes.some(node => node.equals(neighbor))) {
						let costToNeighbor = currentNode.gCost + Path.nodeDistance(currentNode, neighbor);
						if (costToNeighbor < neighbor.gCost || !this.openNodes.some(node => node.equals(neighbor))) {
							neighbor.gCost = costToNeighbor;
							neighbor.hCost = Path.nodeDistance(neighbor, this.endNode);
							if (!this.openNodes.some(node => node.equals(neighbor))) this.openNodes.push(neighbor);
						}
					}
				}
			}
		} catch (e) {
			throw e.stack;
		}
	}
	drawGizmo(scene, color = BABYLON.Color3.White()) {
		if (this.path.length > 0) {
			if (!(scene instanceof BABYLON.Scene)) throw new TypeError('scene must be a scene');
			if (this.gizmo) console.warn('Path gizmo was already drawn!');
			this.gizmo = BABYLON.Mesh.CreateLines(
				'pathGizmo.' + random.hex(16),
				this.path.map(node => node.position),
				scene
			);
			this.gizmo.color = color;
			return this.gizmo;
		}
	}
	disposeGizmo() {
		if (this.gizmo) this.gizmo.dispose();
		this.gizmo = undefined;
	}
};
export const StorageData = class extends Map {
	#max = 1;
	constructor(max = 1, items = {}) {
		super([...Items.keys()].map(i => [i, 0]));
		this.#max = max;
		Object.entries(items).forEach(([item, amount]) => this.add(item, +amount || 0));
	}
	get max() {
		return this.#max;
	}
	get total() {
		return [...this.entries()].reduce((total, [name, amount]) => total + amount * Items.get(name).value, 0);
	}
	empty(filter) {
		for (let name of this.keys()) {
			if ((filter instanceof Array ? filter.includes(name) : filter == name) || !filter) this.set(name, 0);
		}
	}
	serialize() {
		return { items: Object.fromEntries([...this]), max: this.baseMax };
	}
	add(item, amount) {
		this.set(item, this.get(item) + amount);
	}
	remove(item, amount) {
		this.set(item, this.get(item) - amount);
	}
};

export const PlayerData = class extends BABYLON.TransformNode {
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
	velocity = BABYLON.Vector3.Zero();
	speed = 1;
	get power() {
		return this.fleet.reduce((a, ship) => a + (ship._generic.power || 0), 0);
	}
	constructor(data, level) {
		if (!(level instanceof Level) && level) throw new TypeError('passed level not a Level');
		super(data.name, level);
		this.cam = new BABYLON.ArcRotateCamera(data.name, -Math.PI / 2, Math.PI / 2, 5, BABYLON.Vector3.Zero(), level);
		Object.assign(this.cam, config.playerCamera);
		this.cam.target = this.position;
		Object.assign(this, data);
	}
	serialize() {
		return {
			position: this.position.asArray().map(num => +num.toFixed(3)),
			rotation: this.rotation.asArray().map(num => +num.toFixed(3)),
			fleet: this.fleet.map(s => s.id),
			...this.filter('tech', 'items', 'xp', 'xpPoints'),
		};
	}
	addVelocity(vector = BABYLON.Vector3.Zero(), computeMultiplyer) {
		let direction = this.cam.getDirection(vector).scale(1 / Math.PI);
		direction.y = 0;
		direction.normalize();
		if (computeMultiplyer) direction.scaleInPlace(this.speed + this.tech.thrust / 10);
		this.velocity.addInPlace(direction);
	}
};
export const Hardpoint = class extends BABYLON.TransformNode {
	_generic = {};
	#entity;
	#resolve;
	instanceReady;
	projectiles = [];
	constructor(data, ship, id = random.hex(32)) {
		if (!(ship instanceof Ship)) throw new TypeError();
		if (!(ship.level instanceof Level)) throw new TypeError();
		super(id);
		this._generic = Hardpoint.generic.get(data.type);
		this._data = data;

		this.type = data.type;
		this.parent = ship;
		this.#entity = ship;
		this.position = data.position || BABYLON.Vector3.Zero();
		this.rotation = (data.rotation || BABYLON.Vector3.Zero()).addInPlaceFromFloats(0, Math.PI, 0);
		this.reload = this._generic.reload;
		let resolve;
		this.instanceReady = new Promise(res => (resolve = res));
		this.#resolve = resolve;
		this.#createInstance().catch(err => console.warn(`Failed to create hardpoint mesh instance for #${id} of type ${data.type}: ${err}`));
		this.instanceReady.then(() => {
			this.scaling.scaleInPlace(data.scale ?? 1);
		});
	}

	get entity() {
		return this.#entity;
	}

	get level() {
		return this.#entity.level;
	}

	async #createInstance() {
		this.mesh = await this.level.instantiateGenericMesh(this.type);
		this.mesh.setParent(this);
		this.mesh.position = BABYLON.Vector3.Zero();
		this.mesh.rotation = new BABYLON.Vector3(0, 0, Math.PI);
		this.#resolve();
	}

	async createProjectileInstante() {
		return await this.level.instantiateGenericMesh(this.type + '.projectile');
	}

	remove() {
		this.#entity.hardpoints.splice(this.#entity.hardpoints.indexOf(this), 1);
		this.dispose();
	}

	fireProjectile(target, options) {
		this._generic.fire.call(this, target, options);
		this.reload = this._generic.reload;
	}

	static generic = new Map([
		[
			'laser',
			{
				damage: 1,
				reload: 10,
				range: 200,
				critChance: 0.05,
				critFactor: 1.5,
				model: 'models/laser.glb',
				projectiles: 1,
				projectileInterval: 0, //not needed
				projectileSpeed: 5,
				projectileModel: 'models/laser_projectile.glb',
				async fire(target, { projectileMaterials = [] }) {
					await wait(random.int(4, 40));
					const laser = await this.createProjectileInstante(),
						bounding = this.getHierarchyBoundingVectors(),
						targetOffset = random.float(0, bounding.max.subtract(bounding.min).length()),
						startPos = this.getAbsolutePosition(),
						endPos = target.getAbsolutePosition().add(random.cords(targetOffset)),
						frameFactor = BABYLON.Vector3.Distance(startPos, endPos) / this._generic.projectileSpeed,
						material = projectileMaterials.find(({ applies_to = [], material }) => {
							if (applies_to.includes(this.type) && material) {
								return material;
							}
						}, this);
					this.projectiles.push(laser);
					laser.material = material.material;
					for (let child of laser.getChildMeshes()) {
						child.material = material.material;
					}
					laser.scaling = this.scaling;
					laser.position = startPos;
					this.lookAt(endPos);
					laser.lookAt(endPos);
					const animation = new BABYLON.Animation(
						'projectileAnimation',
						'position',
						60,
						BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
						BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
					);
					animation.setKeys([
						{ frame: 0, value: startPos },
						{ frame: 60 * frameFactor, value: endPos },
					]);
					laser.animations.push(animation);
					let result = this.level.beginAnimation(laser, 0, 60 * frameFactor);
					result.disposeOnEnd = true;
					result.onAnimationEnd = () => {
						this.projectiles.splice(this.projectiles.indexOf(laser), 1);
						laser.dispose();
						target.entity.hp -= (this._generic.damage / Level.tickRate) * (Math.random() < this._generic.critChance ? this._generic.critFactor : 1);
					};
				},
			},
		],
	]);
};
export const Entity = class extends BABYLON.TransformNode {
	_generic = { speed: 1 };

	#selected = false;

	constructor(type, owner, level, id = random.hex(32)) {
		if (!(level instanceof Level)) throw new TypeError('passed level must be a Level');
		super(id, level);
		this.id = id;
		this.owner = owner;
		this.level = level;
		this.#createInstance(type).catch(err => console.warn(`Failed to create entity mesh instance for #${id} of type ${type}: ${err}`));
		level.entities.set(this.id, this);
	}

	get entity() {
		return this;
	}

	get selected() {
		return this.#selected;
	}

	select() {
		[this.mesh, ...this.hardpoints.map(hp => hp.mesh)].forEach(mesh => {
			mesh.getChildMeshes().forEach(child => {
				this.level.hl.addMesh(child, BABYLON.Color3.Green());
			});
		});
		this.#selected = true;
	}

	unselect() {
		[this.mesh, ...this.hardpoints.map(hp => hp.mesh)].forEach(mesh => {
			mesh.getChildMeshes().forEach(child => {
				this.level.hl.removeMesh(child);
			});
		});
		this.#selected = false;
	}

	async #createInstance(type) {
		this.mesh = await this.level.instantiateGenericMesh(type);
		this.mesh.setParent(this);
		this.mesh.position = BABYLON.Vector3.Zero();
		this.mesh.rotation = new BABYLON.Vector3(0, 0, Math.PI);
	}

	remove() {
		this.mesh.dispose();
		this.getScene().entities.delete(this.id);
	}

	toString() {
		return `Entity #${this.id}`;
	}

	followPath(path) {
		if (!(path instanceof Path)) throw new TypeError('path must be a Path');
		return new Promise(resolve => {
			let animation = new BABYLON.Animation(
					'pathFollow',
					'position',
					60 * this._generic.speed,
					BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
					BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
				),
				rotateAnimation = new BABYLON.Animation(
					'pathRotate',
					'rotation',
					60 * this._generic.agility,
					BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
					BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
				);

			animation.setKeys(path.path.map((node, i) => ({ frame: i * 60 * this._generic.speed, value: node.position })));
			rotateAnimation.setKeys(
				path.path.flatMap((node, i) => {
					if (i != 0) {
						let value = BABYLON.Vector3.PitchYawRollToMoveBetweenPoints(path.path[i - 1].position, node.position);
						value.x -= Math.PI / 2;
						return [
							{ frame: i * 60 * this._generic.agility - 30, value },
							{ frame: i * 60 * this._generic.agility - 10, value },
						];
					} else {
						return [{ frame: 0, value: this.rotation }];
					}
				})
			);
			if (path.path.length > 0) {
				this.animations.push(animation);
				this.animations.push(rotateAnimation);
				let result = this.level.beginAnimation(this, 0, path.path.length * 60);
				result.disposeOnEnd = true;
				result.onAnimationEnd = resolve;
			}
		});
	}

	moveTo(location, isRelative) {
		if (!(location instanceof BABYLON.Vector3)) throw new TypeError('location must be a Vector3');
		if (this.currentPath && config.settings.debug.show_path_gizmos) this.currentPath.disposeGizmo();
		this.currentPath = new Path(this.position, location.add(isRelative ? this.position : BABYLON.Vector3.Zero()), this.level);
		if (config.settings.debug.show_path_gizmos) this.currentPath.drawGizmo(this.level, BABYLON.Color3.Green());
		this.followPath(this.currentPath).then(() => {
			if (config.settings.debug.show_path_gizmos) {
				this.currentPath.disposeGizmo();
			}
		});
	}

	serialize() {
		return {
			position: this.position.asArray().map(num => +num.toFixed(3)),
			rotation: this.rotation.asArray().map(num => +num.toFixed(3)),
			owner: this.owner?.id,
			id: this.id,
			name: this.name,
			type: 'entity',
		};
	}
	static generic = new Map();
	static FromData(data, owner, level) {
		let entity = new Entity(data.type, owner, level, data.id);
		entity.position = BABYLON.Vector3.FromArray(data.position);
		entity.rotation = BABYLON.Vector3.FromArray(data.rotation);
		return entity;
	}
};
export const Ship = class extends Entity {
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
		this.owner.fleet.spliceOut(this);
		this.getScene().entities.delete(this.id);
	}
	jump(location) {
		if (!(location instanceof BABYLON.Vector3)) throw new TypeError('Location is not a Vector3');
		if (this.jumpCooldown > 0) return 'Hyperspace still on cooldown';
		if (BABYLON.Vector3.Distance(this.position, location) > this._generic.jumpRange) return 'Target location out of range';

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
				hardpoints: [{ type: 'laser', position: new BABYLON.Vector3(0, 0.01, 0.05), scale: 0.25 }],
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
					{ type: 'laser', position: new BABYLON.Vector3(-0.025, 0.0075, -0.075), scale: 0.375 },
					{ type: 'laser', position: new BABYLON.Vector3(0.025, 0.0075, -0.075), scale: 0.375 },
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
					{ type: 'laser', position: new BABYLON.Vector3(-0.06, 0.03, -0.1), scale: 0.75 },
					{ type: 'laser', position: new BABYLON.Vector3(0.06, 0.03, -0.1), scale: 0.75 },
					{ type: 'laser', position: new BABYLON.Vector3(0.06, 0.015, 0.05), scale: 0.75 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.06, 0.015, 0.05), scale: 0.75 },
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
					{ type: 'laser', position: new BABYLON.Vector3(0.1, 0.04, -0.1), rotation: new BABYLON.Vector3(0, Math.PI / 2, 0), scale: 0.8 },
					{ type: 'laser', position: new BABYLON.Vector3(0.1, 0.04, -0.05), rotation: new BABYLON.Vector3(0, Math.PI / 2, 0), scale: 0.8 },
					{ type: 'laser', position: new BABYLON.Vector3(0.1, 0.04, 0), rotation: new BABYLON.Vector3(0, Math.PI / 2, 0), scale: 0.8 },
					{ type: 'laser', position: new BABYLON.Vector3(0.1, 0.04, 0.05), rotation: new BABYLON.Vector3(0, Math.PI / 2, 0), scale: 0.8 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.1, 0.04, -0.1), rotation: new BABYLON.Vector3(0, -Math.PI / 2, 0), scale: 0.8 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.1, 0.04, -0.05), rotation: new BABYLON.Vector3(0, -Math.PI / 2, 0), scale: 0.8 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.1, 0.04, 0), rotation: new BABYLON.Vector3(0, -Math.PI / 2, 0), scale: 0.8 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.1, 0.04, 0.05), rotation: new BABYLON.Vector3(0, -Math.PI / 2, 0), scale: 0.8 },
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
					{ type: 'laser', position: new BABYLON.Vector3(0.325, 0.0375, -1.225), rotation: new BABYLON.Vector3(0, Math.PI / 2, 0), scale: 0.85 },
					{ type: 'laser', position: new BABYLON.Vector3(0.325, 0.0375, -1.15), rotation: new BABYLON.Vector3(0, Math.PI / 2, 0), scale: 0.85 },
					{ type: 'laser', position: new BABYLON.Vector3(0.325, 0.0375, -1.075), rotation: new BABYLON.Vector3(0, Math.PI / 2, 0), scale: 0.85 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.325, 0.0375, -1.225), rotation: new BABYLON.Vector3(0, -Math.PI / 2, 0), scale: 0.85 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.325, 0.0375, -1.15), rotation: new BABYLON.Vector3(0, -Math.PI / 2, 0), scale: 0.85 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.325, 0.0375, -1.075), rotation: new BABYLON.Vector3(0, -Math.PI / 2, 0), scale: 0.85 },
					{ type: 'laser', position: new BABYLON.Vector3(0.1, 0.03, -0.35), rotation: new BABYLON.Vector3(0, Math.PI / 2, 0), scale: 0.75 },
					{ type: 'laser', position: new BABYLON.Vector3(0.1, 0.03, -0.2875), rotation: new BABYLON.Vector3(0, Math.PI / 2, 0), scale: 0.75 },
					{ type: 'laser', position: new BABYLON.Vector3(0.1, 0.03, -0.225), rotation: new BABYLON.Vector3(0, Math.PI / 2, 0), scale: 0.75 },
					{ type: 'laser', position: new BABYLON.Vector3(0.1, 0.03, -0.1625), rotation: new BABYLON.Vector3(0, Math.PI / 2, 0), scale: 0.75 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.1, 0.03, -0.35), rotation: new BABYLON.Vector3(0, -Math.PI / 2, 0), scale: 0.75 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.1, 0.03, -0.2875), rotation: new BABYLON.Vector3(0, -Math.PI / 2, 0), scale: 0.75 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.1, 0.03, -0.225), rotation: new BABYLON.Vector3(0, -Math.PI / 2, 0), scale: 0.75 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.1, 0.03, -0.1625), rotation: new BABYLON.Vector3(0, -Math.PI / 2, 0), scale: 0.75 },
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
					{ type: 'laser', position: new BABYLON.Vector3(2.125, 0.055, -0.5), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(2, 0.055, 0), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(1.875, 0.055, 0.5), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(1.75, 0.055, 1), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(1.625, 0.055, 1.5), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(1.5, 0.055, 2), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(1.375, 0.055, 2.5), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(1.25, 0.055, 3), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(1.125, 0.055, 3.5), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(1, 0.055, 4), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(0.875, 0.055, 4.5), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(0.75, 0.055, 5), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(0.625, 0.055, 5.5), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(0.5, 0.055, 6), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(0.375, 0.055, 6.5), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(0.25, 0.055, 7), rotation: new BABYLON.Vector3(0, (Math.PI * 5) / 12, 0), scale: 1.5 },

					{ type: 'laser', position: new BABYLON.Vector3(-2.125, 0.055, -0.5), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(-2, 0.055, 0), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(-1.875, 0.055, 0.5), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(-1.75, 0.055, 1), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(-1.625, 0.055, 1.5), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(-1.5, 0.055, 2), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(-1.375, 0.055, 2.5), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(-1.25, 0.055, 3), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(-1.125, 0.055, 3.5), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(-1, 0.055, 4), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.875, 0.055, 4.5), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.75, 0.055, 5), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.625, 0.055, 5.5), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.5, 0.055, 6), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.375, 0.055, 6.5), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
					{ type: 'laser', position: new BABYLON.Vector3(-0.25, 0.055, 7), rotation: new BABYLON.Vector3(0, (-Math.PI * 5) / 12, 0), scale: 1.5 },
				],
			},
		],
	]);
	static FromData(data, owner, level) {
		const ship = new Ship(data.class, owner, level);
		Object.assign(ship, {
			id: data.id,
			class: data.class,
			position: BABYLON.Vector3.FromArray(data.position),
			rotation: BABYLON.Vector3.FromArray(data.rotation),
			storage: new StorageData(Ship.generic.get(data.class).storage, data.storage),
			hp: +data.hp,
			reload: +data.reload,
			jumpCooldown: +data.jumpCooldown,
		});
	}
};
export const CelestialBodyMaterial = class extends BABYLON.ShaderMaterial {
	constructor(options, level) {
		options.mapSize = 1024;
		options.maxResolution = [64, 256, 1024][config.render_quality];
		let id = random.hex(8);
		super('CelestialBodyMaterial.' + id, level, './shaders/planet', {
			attributes: ['position', 'normal', 'uv'],
			uniforms: ['world', 'worldView', 'worldViewProjection', 'view', 'projection'],
			needAlphaBlending: true,
		});
		level.onActiveCameraChanged.add(() => {
			this.setVector3('cameraPosition', level.activeCamera.position);
		});
		this.generationOptions = options;
		this.rotationFactor = Math.random();
		this.matrixAngle = 0;

		this.setVector3('cameraPosition', level.activeCamera?.position || BABYLON.Vector3.Zero());
		this.setVector3('lightPosition', BABYLON.Vector3.Zero());

		this.noiseTexture = this.generateTexture(
			id,
			'./shaders/noise',
			{ ...options, options: new BABYLON.Vector3(options.directNoise ? 1.0 : 0, options.lowerClip.x, options.lowerClip.y) },
			level
		);
		this.setTexture('textureSampler', this.noiseTexture);

		this.cloudTexture = this.generateTexture(id, './shaders/cloud', { ...options, options: new BABYLON.Vector3(1.0, 0, 0) }, level);
		this.setTexture('cloudSampler', this.cloudTexture);

		this.setColor3('haloColor', options.haloColor);
	}

	generateTexture(id, path, options, level) {
		let sampler = new BABYLON.DynamicTexture('CelestialBodyMaterial.sampler.' + id, 512, level, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
		CelestialBodyMaterial.updateRandom(sampler);
		let texture = new BABYLON.ProceduralTexture('CelestialBodyMaterial.texture.' + id, options.mapSize, path, level, null, true, true);
		texture.setColor3('upperColor', options.upperColor);
		texture.setColor3('lowerColor', options.lowerColor);
		texture.setFloat('mapSize', options.mapSize);
		texture.setFloat('maxResolution', options.maxResolution);
		texture.setFloat('seed', options.seed);
		texture.setVector2('lowerClamp', options.lowerClamp);
		texture.setTexture('randomSampler', sampler);
		texture.setVector2('range', options.range);
		texture.setVector3('options', options.options);
		texture.refreshRate = 0;
		return texture;
	}

	static updateRandom(texture) {
		if (!(texture instanceof BABYLON.DynamicTexture)) throw new TypeError(`Can't update texture: not a dynamic texture`);
		let context = texture.getContext(),
			imageData = context.getImageData(0, 0, 512, 512);
		for (let i = 0; i < 1048576; i++) {
			imageData.data[i] = (Math.random() * 256) | 0;
		}
		context.putImageData(imageData, 0, 0);
		texture.update();
	}
};
export const CelestialBody = class extends BABYLON.Mesh {
	fleet = [];
	owner = null;
	fleetLocation = BABYLON.Vector3.Zero();
	get power() {
		return this.fleet.reduce((total, ship) => total + ship._generic.power, 0) ?? 0;
	}
	constructor(name, id = random.hex(32), level) {
		if (!(level instanceof Level)) throw new TypeError('level must be a Level');
		super(name, level);
		this.id = id;
		level.bodies.set(id, this);
	}
	remove() {
		this.dispose();
		this.getScene().bodies.delete(this.id);
	}
};
export const Star = class extends CelestialBody {
	constructor({ name, position = BABYLON.Vector3.Zero(), radius = 1, color = BABYLON.Color3.Gray(), scene, id }) {
		super(name ?? 'Unknown Star', id, scene);
		BABYLON.CreateSphereVertexData({ diameter: radius * 2, segments: config.mesh_segments }).applyToMesh(this);
		Object.assign(this, {
			position,
			light: Object.assign(new BABYLON.PointLight(this.id + '.light', position, scene), { intensity: 1, range: 10000 }),
			material: Object.assign(new BABYLON.StandardMaterial(this.id + '.mat', scene), {
				//emissiveTexture: new NoiseProceduralTexture(this.id + ".texture", config.mesh_segments, scene),
				emissiveColor: color,
				disableLighting: true,
			}),
			radius,
			color,
			isStar: true,
		});
		//Object.assign(s.material.emissiveTexture, {animationSpeedFactor: 0.1, octaves: 8, persistence:0.8});
		//s.material.Fragment_Before_FragColor(`color = vec4(vec3(color.xyz),1.0);`);
	}
};
export const Planet = class extends CelestialBody {
	constructor({ name, position = BABYLON.Vector3.Zero(), biome = 'earthlike', radius = 1, owner = null, fleet = [], rewards = {}, scene, id }) {
		super(name ?? 'Unknown Planet', id, scene);
		BABYLON.CreateSphereVertexData({ diameter: radius * 2, segments: config.mesh_segments }).applyToMesh(this);
		Object.assign(this, {
			owner,
			radius,
			rewards,
			biome,
			position,
			material: Planet.biomes.has(biome) ? new CelestialBodyMaterial(Planet.biomes.get(biome), scene) : new BABYLON.StandardMaterial('mat', scene),
		});
		this.fleetLocation = random.cords(random.int(radius + 5, radius * 1.2), true);
		for (let shipOrType of fleet) {
			if (shipOrType instanceof Ship) {
				this.fleet.push(shipOrType);
			} else {
				let ship = new Ship(shipOrType, this, scene);
				ship.position.addInPlace(this.fleetLocation);
			}
		}
		this._customHardpointProjectileMaterials = [
			{
				applies_to: ['laser'],
				material: Object.assign(new BABYLON.StandardMaterial('player-laser-projectile-material', scene), { emissiveColor: BABYLON.Color3.Red() }),
			},
		];
	}

	static biomes = new Map([
		[
			'earthlike',
			{
				clouds: false, //true,
				upperColor: new BABYLON.Color3(0.2, 2.0, 0.2),
				lowerColor: new BABYLON.Color3(0, 0.2, 1.0),
				haloColor: new BABYLON.Color3(0, 0.2, 1.0),
				seed: 0.3,
				cloudSeed: 0.6,
				lowerClamp: new BABYLON.Vector2(0.6, 1),
				groundAlbedo: 1.25,
				cloudAlbedo: 0,
				directNoise: false,
				lowerClip: new BABYLON.Vector2(0, 0),
				range: new BABYLON.Vector2(0.3, 0.35),
				icon: 'earth-americas',
			},
		],
		[
			'volcanic',
			{
				upperColor: new BABYLON.Color3(0.9, 0.45, 0.45),
				lowerColor: new BABYLON.Color3(1.0, 0, 0),
				haloColor: new BABYLON.Color3(1.0, 0, 0.3),
				seed: 0.3,
				cloudSeed: 0.6,
				clouds: false,
				lowerClamp: new BABYLON.Vector2(0, 1),
				maxResolution: 256,
				cloudAlbedo: 0,
				groundAlbedo: 1.0,
				directNoise: false,
				lowerClip: new BABYLON.Vector2(0, 0),
				range: new BABYLON.Vector2(0.3, 0.4),
				icon: 'planet-ringed',
			},
		],
		[
			'jungle',
			{
				upperColor: new BABYLON.Color3(0.1, 0.3, 0.7),
				lowerColor: new BABYLON.Color3(0, 1.0, 0.1),
				haloColor: new BABYLON.Color3(0.5, 1.0, 0.5),
				seed: 0.4,
				cloudSeed: 0.7,
				clouds: false, //true,
				lowerClamp: new BABYLON.Vector2(0, 1),
				maxResolution: 512,
				cloudAlbedo: 1.0,
				groundAlbedo: 1.1,
				directNoise: false,
				lowerClip: new BABYLON.Vector2(0, 0),
				range: new BABYLON.Vector2(0.2, 0.4),
				icon: 'earth-americas',
			},
		],
		[
			'ice',
			{
				upperColor: new BABYLON.Color3(1.0, 1.0, 1.0),
				lowerColor: new BABYLON.Color3(0.7, 0.7, 0.9),
				haloColor: new BABYLON.Color3(1.0, 1.0, 1.0),
				seed: 0.8,
				cloudSeed: 0.4,
				clouds: false, //true,
				lowerClamp: new BABYLON.Vector2(0, 1),
				maxResolution: 256,
				cloudAlbedo: 1.0,
				groundAlbedo: 1.1,
				directNoise: false,
				lowerClip: new BABYLON.Vector2(0, 0),
				range: new BABYLON.Vector2(0.3, 0.4),
				icon: 'planet-ringed',
			},
		],
		[
			'desert',
			{
				upperColor: new BABYLON.Color3(0.9, 0.3, 0),
				lowerColor: new BABYLON.Color3(1.0, 0.5, 0.1),
				haloColor: new BABYLON.Color3(1.0, 0.5, 0.1),
				seed: 0.18,
				cloudSeed: 0.6,
				clouds: false,
				lowerClamp: new BABYLON.Vector2(0.3, 1),
				maxResolution: 512,
				cloudAlbedo: 1.0,
				groundAlbedo: 1.0,
				directNoise: false,
				lowerClip: new BABYLON.Vector2(0, 0),
				range: new BABYLON.Vector2(0.3, 0.4),
				icon: 'planet-ringed',
			},
		],
		[
			'islands',
			{
				upperColor: new BABYLON.Color3(0.4, 2.0, 0.4),
				lowerColor: new BABYLON.Color3(0, 0.2, 2.0),
				haloColor: new BABYLON.Color3(0, 0.2, 2.0),
				seed: 0.15,
				cloudSeed: 0.6,
				clouds: false, //true,
				lowerClamp: new BABYLON.Vector2(0.6, 1),
				maxResolution: 512,
				cloudAlbedo: 1.0,
				groundAlbedo: 1.2,
				directNoise: false,
				lowerClip: new BABYLON.Vector2(0, 0),
				range: new BABYLON.Vector2(0.2, 0.3),
				icon: 'earty-oceania',
			},
		],
		[
			'moon',
			{
				upperColor: new BABYLON.Color3(2.0, 1.0, 0),
				lowerColor: new BABYLON.Color3(0, 0.2, 1.0),
				cloudSeed: 0.6,
				lowerClamp: new BABYLON.Vector2(0.6, 1),
				cloudAlbedo: 0.9,
				range: new BABYLON.Vector2(0.3, 0.35),
				haloColor: new BABYLON.Color3(0, 0, 0),
				seed: 0.5,
				clouds: false,
				groundAlbedo: 0.7,
				directNoise: true,
				lowerClip: new BABYLON.Vector2(0.5, 0.9),
				icon: 'planet-ringed',
			},
		],
	]);
};

export const StationComponent = class extends BABYLON.TransformNode {
	_generic = {};
	#station;
	#resolve;
	instanceReady;
	connections = [];
	constructor(type, station, id = random.hex(32)) {
		if (!(station instanceof Station)) throw new TypeError();
		if (!(station.level instanceof Level)) throw new TypeError();
		super(id, station.level);

		this._generic = StationComponent.generic.get(type);

		this.type = type;
		this.#station = station;

		let resolve;
		this.instanceReady = new Promise(res => (resolve = res));
		this.#resolve = resolve;
		this.#createInstance().catch(err => console.warn(`Failed to create hardpoint mesh instance for #${id} of type ${type}: ${err}`));
	}

	get station() {
		return this.#station;
	}

	get level() {
		return this.#station.level;
	}

	async #createInstance() {
		this.mesh = await this.level.instantiateGenericMesh('station.' + this.type);
		this.mesh.setParent(this);
		this.mesh.position = BABYLON.Vector3.Zero();
		this.mesh.rotation = new BABYLON.Vector3(0, 0, Math.PI);
		this.#resolve();
	}

	addConnection(component, connecter, componentConnecter) {
		let connection1 = this._generic.connecters.at(connecter),
			connection2 = component._generic.connecters.at(componentConnecter);
		if (!connection1) {
			throw new ReferenceError(`Connecter "${connecter}" does not exist`);
		}
		if (!connection2) {
			throw new ReferenceError(`Subcomponent connecter "${componentConnecter}" does not exist`);
		}

		this.#station.components.push(component);
		this.connections[connecter] = component;
		component.connections[componentConnecter] = this;

		component.parent = this;
		component.position = connection1.position.clone(); //.add(connection2.position);
		component.rotation = connection1.rotation.clone(); //.add(connection2.rotation);
	}

	removeConnection(component) {
		this.connections[this.connections.indexOf(component)] = undefined;
		component.connections[component.connections.indexOf(this)] = undefined;
	}

	removeConnectionAtIndex(connecter) {
		const component = this.connections[connecter];
		return this.removeConnection(component);
	}

	serialize() {
		return {
			id: this.id,
			type: this.type,
			position: this.position.asArray(),
			rotation: this.rotation.asArray(),
			connections: this.connections.map(component => component.serialize()),
		};
	}

	remove() {
		this.#station.components.splice(this.#station.components.indexOf(this), 1);
		for (let connection of this.connections) {
			this.removeConnection(connection);
		}
		this.dispose();
	}

	static generic = new Map([
		[
			'core',
			{
				type: 'core',
				hp: 100,
				model: 'models/station/core.glb',
				connecters: [
					{ type: '*', position: new BABYLON.Vector3(0, 0, 0), rotation: new BABYLON.Vector3(0, 0, 0) },
					{ type: '*', position: new BABYLON.Vector3(0, 0, 0), rotation: new BABYLON.Vector3(0, Math.PI / 2, 0) },
					{ type: '*', position: new BABYLON.Vector3(0, 0, 0), rotation: new BABYLON.Vector3(0, Math.PI, 0) },
					{ type: '*', position: new BABYLON.Vector3(0, 0, 0), rotation: new BABYLON.Vector3(0, (3 * Math.PI) / 2, 0) },
				],
			},
		],
		[
			'connecter_i',
			{
				type: 'connecter',
				hp: 50,
				model: 'models/station/connecter_i.glb',
				connecters: [
					{ type: '*', position: new BABYLON.Vector3(0, 0, -0.5), rotation: BABYLON.Vector3.Zero() },
					{ type: '*', position: new BABYLON.Vector3(0, 0, 0.5), rotation: BABYLON.Vector3.Zero() },
				],
			},
		],
	]);
};

export const Station = class extends CelestialBody {
	components = [];
	#core;
	#level;

	constructor({ name = 'Station', id = random.hex(32) }, level) {
		super(name, id, level);

		this.#level = level;
		this.#core = new StationComponent('core', this);
		this.#core.parent = this;
	}

	get level() {
		return this.#level;
	}

	get core() {
		return this.#core;
	}

	serialize() {
		return {
			id: this.id,
			components: this.#core.serialize(),
		};
	}

	remove() {}
};

export const Level = class extends BABYLON.Scene {
	id = random.hex(16);
	name = '';
	version = version;
	date = new Date();
	difficulty = 1;
	clearColor = new BABYLON.Color3(0.8, 0.75, 0.85);
	genericMeshes = {};
	bodies = new Map();
	entities = new Map();
	playerData = new Map();
	#initPromise = new Promise(() => {});
	loadedGenericMeshes = new Promise(() => {});
	#performanceMonitor = new BABYLON.PerformanceMonitor(60);
	constructor(name, engine, doNotGenerate) {
		super(engine);
		Object.assign(this, {
			skybox: BABYLON.MeshBuilder.CreateBox('skybox', { size: Level.system.size * 2 }, this),
			gl: Object.assign(new BABYLON.GlowLayer('glowLayer', this), { intensity: 0.9 }),
			hl: new BABYLON.HighlightLayer('highlight', this),
			xzPlane: BABYLON.MeshBuilder.CreatePlane('xzPlane', { size: Level.system.size * 2 }, this),
			probe: new BABYLON.ReflectionProbe('probe', 256, this),
		});
		this.xzPlane.rotation.x = Math.PI / 2;
		this.xzPlane.setEnabled(false);
		this.skybox.infiniteDistance = true;
		this.skybox.isPickable = false;
		this.skybox.material = Object.assign(new BABYLON.StandardMaterial('skybox.mat', this), {
			backFaceCulling: false,
			disableLighting: true,
			reflectionTexture: BABYLON.CubeTexture.CreateFromImages(Array(6).fill('images/skybox.jpg'), this),
		});
		this.skybox.material.reflectionTexture.coordinatesMode = 5;
		this.name = name;

		this.loadedGenericMeshes = this.#loadGenericMeshes();
		this.#initPromise = doNotGenerate ? Promise.resolve(this) : this.init();
		this.registerBeforeRender(() => {
			let ratio = this.getAnimationRatio();
			for (let body of this.bodies.values()) {
				if (body instanceof Planet && body.material instanceof CelestialBodyMaterial) {
					body.rotation.y += 0.0001 * ratio * body.material.rotationFactor;
					body.material.setMatrix('rotation', BABYLON.Matrix.RotationY(body.matrixAngle));
					body.matrixAngle -= 0.0004 * ratio;
					body.material.setVector3(
						'options',
						new BABYLON.Vector3(body.material.generationOptions.clouds, body.material.generationOptions.groundAlbedo, body.material.generationOptions.cloudAlbedo)
					);
				}
			}
		});
	}
	get selectedEntities() {
		return [...this.entities.values()].filter(e => e.selected);
	}
	get tps() {
		return this.#performanceMonitor.averageFPS;
	}
	async #loadGenericMeshes() {
		for (let [id, generic] of [
			...Ship.generic,
			...[...Hardpoint.generic].flatMap(e => [e, [e[0] + '.projectile', { model: e[1].projectileModel }]]),
			...[...StationComponent.generic].map(([key, val]) => ['station.' + key, val]),
		]) {
			try {
				let container = (this.genericMeshes[id] = await BABYLON.SceneLoader.LoadAssetContainerAsync('', generic.model, this));
				Object.assign(container.meshes[0], {
					rotationQuaternion: null,
					material: Object.assign(container.materials[0], {
						realTimeFiltering: true,
						realTimeFilteringQuality: [2, 8, 32][+config.render_quality],
						reflectionTexture: this.probe.cubeTexture,
					}),
					position: BABYLON.Vector3.Zero(),
					isVisible: false,
					isPickable: false,
				});
				this.probe.renderList.push(container.meshes[1]);
			} catch (err) {
				console.error(`Failed to load model for generic type ${id} from ${generic.model}: ${err}`);
			}
		}
	}
	async instantiateGenericMesh(id) {
		await this.loadedGenericMeshes;

		let instance;
		if (typeof this.genericMeshes[id]?.instantiateModelsToScene == 'function') {
			instance = this.genericMeshes[id].instantiateModelsToScene().rootNodes[0];
		} else {
			instance = BABYLON.MeshBuilder.CreateBox('error_mesh', { size: 1 }, this);
			instance.material = new BABYLON.StandardMaterial('error_material', this);
			instance.material.emissiveColor = BABYLON.Color3.Gray();
			throw 'Origin mesh does not exist';
		}

		return instance;
	}
	async init() {
		return await Level.generate.system('Crash Site', BABYLON.Vector3.Zero(), this);
	}
	async generateRegion(x, y, size) {
		await this.ready();
	}
	async ready() {
		await Promise.allSettled([this.#initPromise, this.loadedGenericMeshes]);
		return this;
	}
	getPlayerData(nameOrID) {
		return [...this.playerData].filter(([id, data]) => data.name == nameOrID || id == nameOrID)[0]?.[1];
	}
	getEntities(selector) {
		if (typeof selector != 'string') throw new TypeError('getEntity: selector must be of type string');
		switch (selector[0]) {
			case '@':
				if (this.getPlayerData(selector.slice(1)) instanceof PlayerData) {
					return this.getPlayerData(selector.slice(1));
				} else {
					console.warn(`Player ${selector} does not exist`);
				}
				break;
			case '*':
				return [...this.entities.values()];
			case '#':
				if (this.entities.has(selector.slice(1))) {
					return this.entities.get(selector.slice(1));
				} else {
					console.warn(`Entity ${selector} does not exist`);
				}
				break;
		}
	}
	getBodies(selector) {
		if (typeof selector != 'string') throw new TypeError('getBody: selector must be of type string');
		switch (selector[0]) {
			case '*':
				return [...this.bodies.values()];
			case '#':
				for (let [id, body] of this.bodies) {
					if (id == selector.slice(1)) return body;
				}
				break;
		}
	}
	tick() {
		this.#performanceMonitor.sampleFrame();
		for (let playerData of this.playerData.values()) {
			if (Math.abs(playerData.rotation.y) > Math.PI) {
				playerData.rotation.y += Math.sign(playerData.rotation.y) * 2 * Math.PI;
			}
		}
		for (let entity of this.entities.values()) {
			for (let hp of entity.hardpoints) {
				hp.reload = Math.max(--hp.reload, 0);
			}
			if (entity.hp <= 0) {
				entity.remove();
				//Events: trigger event, for sounds
			} else if (entity instanceof Ship) {
				entity.jumpCooldown = Math.max(--entity.jumpCooldown, 0);
				const entityRange = entity.hardpoints.reduce((a, hp) => Math.max(a, hp._generic.range), 0);
				let targets = [...this.entities.values()].filter(e => e.owner != entity.owner && BABYLON.Vector3.Distance(e.position, entity.position) < entityRange);
				let target = targets.reduce(
					(ac, cur) =>
						(ac =
							BABYLON.Vector3.Distance(ac?.getAbsolutePosition ? ac.getAbsolutePosition() : BABYLON.Vector3.One().scale(Infinity), entity.getAbsolutePosition()) <
							BABYLON.Vector3.Distance(cur.getAbsolutePosition(), entity.getAbsolutePosition())
								? ac
								: cur),
					null
				);
				if (target) {
					for (let hp of entity.hardpoints) {
						let targetPoints = [...target.hardpoints, target].filter(
								e => BABYLON.Vector3.Distance(e.getAbsolutePosition(), hp.getAbsolutePosition()) < hp._generic.range
							),
							targetPoint = targetPoints.reduce(
								(ac, cur) =>
									(ac =
										BABYLON.Vector3.Distance(ac.getAbsolutePosition(), hp.getAbsolutePosition()) <
										BABYLON.Vector3.Distance(cur.getAbsolutePosition(), hp.getAbsolutePosition())
											? ac
											: cur),
								target
							);
						if (hp.reload <= 0) {
							hp.fireProjectile(targetPoint, { projectileMaterials: entity.owner?._customHardpointProjectileMaterials });
						}
					}
				}
			}
		}
	}
	screenToWorldPlane(x, y, pickY) {
		this.xzPlane.position.y = pickY || 0;
		let pickInfo = this.pick(x, y, mesh => mesh == this.xzPlane);
		return pickInfo.pickedPoint || BABYLON.Vector3.Zero();
	}
	handleCanvasClick(e, owner) {
		owner ??= [...this.playerData][0];
		if (!e.shiftKey) {
			for (let entity of this.entities.values()) {
				entity.unselect();
			}
		}
		let pickInfo = this.pick(this.pointerX, this.pointerY, mesh => {
			let node = mesh;
			while (node.parent) {
				node = node.parent;
				if (node instanceof Ship) {
					return true;
				}
			}
			return false;
		});
		if (pickInfo.pickedMesh) {
			let node = pickInfo.pickedMesh;
			while (node.parent) {
				node = node.parent;
			}
			if (node instanceof Ship && node.owner == owner) {
				if (node.selected) {
					node.unselect();
				} else {
					node.select();
				}
			}
		}
	}
	handleCanvasRightClick(e, owner) {
		for (let entity of this.entities.values()) {
			if (entity.selected && entity.owner == owner) {
				let newPosition = this.screenToWorldPlane(e.clientX, e.clientY, entity.position.y);
				entity.moveTo(newPosition, false);
			}
		}
	}
	serialize() {
		let data = {
			date: this.date.toJSON(),
			bodies: {},
			entities: [],
			playerData: {},
			difficulty: this.difficulty,
			version: this.version,
			name: this.name,
			id: this.id,
		};
		for (let entity of this.entities.values()) {
			if (!(entity instanceof Entity)) {
				console.warn(`entity #${entity?.id} not serialized: not an entity`);
			} else {
				data.entities.push(entity.serialize());
			}
		}

		for (let [id, body] of this.bodies) {
			if (!(body instanceof CelestialBody)) {
				console.warn(`body #${body?.id} not serialized: not a celestial body`);
			} else {
				let bodyData = (data.bodies[id] = {
					position: body.position.asArray().map(num => +num.toFixed(3)),
					fleetLocation: body.fleetLocation.asArray().map(num => +num.toFixed(3)),
					...body.filter('name', 'id', 'owner'),
				});
				switch (body.constructor.name) {
					case 'Star':
						Object.assign(bodyData, {
							type: 'star',
							radius: body.radius,
							color: body.material.emissiveColor.asArray().map(num => +num.toFixed(3)),
						});
						break;
					case 'Planet':
						Object.assign(bodyData, {
							type: 'planet',
							biome: body.biome,
							radius: body.radius,
						});
						break;
					default:
						bodyData.type = null;
				}
			}
		}
		data.playerData = [...this.playerData].map(([id, player]) => [id, player.serialize()]);
		return data;
	}

	static get tickRate() {
		return 10;
	}

	static upgrades = new Map([
		['infdev_11', data => ({ ...data, version: 'alpha_1.0.0' })],
		['infdev_12', data => ({ ...data, version: 'alpha_1.0.0' })],
		[
			'alpha_1.2.0',
			data => ({
				...data,
				entities: data.entities.map(e => {
					e.class = e.shipType;
					return e;
				}),
			}),
		],
	]);

	static upgrade(data) {
		while (version != data.version && Level.upgrades.has(data.version)) {
			data = Level.upgrades.get(data.version)(data);
			if (version != data.version && !Level.upgrades.has(data.version)) {
				alert(`Can't upgrade level from ${versions.get(data.version).text} to ${versions.get(version).text}.`);
			}
		}
		return data;
	}

	static system = {
		names: [
			'Abrigato',
			'Kerali',
			'Kaltez',
			'Suzum',
			'Vespa',
			'Coruscare',
			'Vulca',
			'Jaeger',
			'Kashyyyk',
			'Outpost42',
			'Victoria',
			'Gesht',
			'Sanctuary',
			'Snowmass',
			'Ja',
			'Keeg',
			'Haemeiguli',
			'Borebalae',
			'Albataetarius',
			'Hataerius',
			'Achernaiphoros',
			'Antadrophei',
			'Hoemeirai',
			'Antabalis',
			'Hoereo',
			'Pazadam',
			'Equidor',
			'Pax',
			'Xena',
			'Titan',
			'Oturn',
			'Thuamia',
			'Heuthea',
			'Ditharus',
			'Muxater',
			'Trukovis',
			'Bichotune',
			'Etis',
			'Leorus',
			'Aphus',
			'Harophos',
			'Athena',
			'Hades',
			'Icarus',
			'Ureus',
			'Xentos Prime',
			'Ketlak',
			'Aerox',
			'Thryox',
			'Stratus',
			'Nox',
			'Sanctum',
			'Pastūra',
			'Tinctus',
			'Morbus',
			'Neos',
			'Nomen',
			'Numerus',
			'Pax',
			'Fornax',
			'Skorda',
			'Alli',
			'Resurs',
			'Home',
		],
		size: 5000,
		maxPlanets: 9,
	};

	static generate = {
		system: async (name, position, level) => {
			let star = new Star({
				name,
				position,
				radius: random.int(300, 500),
				color: new BABYLON.Color3(
					Math.random() ** 3 / 2 + random.float(0.3, 0.4),
					Math.random() ** 3 / 2 + random.float(0.3, 0.4),
					Math.random() ** 3 / 2 + random.float(0.3, 0.4)
				),
				scene: level,
			});
			let nameMode = random.bool,
				planetNum = random.int(1, Level.system.maxPlanets),
				names = random.bool ? greek.slice(0, planetNum) : range(1, planetNum + 1),
				planets = [];
			for (let i in names) {
				let planetName = nameMode ? names[i] + ' ' + name : name + ' ' + names[i],
					radius = random.int(25, 50);
				planets[i] = new Planet({
					name: random.int(0, 9999) == 0 ? 'Jude' : planetName,
					position: random.cords(random.int((star.radius + radius) * 1.5, Level.system.size), true),
					radius,
					biome: ['earthlike', 'volcanic', 'jungle', 'ice', 'desert', 'moon'][random.int(0, 5)],
					fleet: generate.enemies(level.difficulty * (i + 1)),
					rewards: generate.items(1000 * i * (2 - level.difficulty)),
					scene: level,
				});
			}
		},
	};

	static Load(levelData, engine, level) {
		if (levelData.version != version) {
			alert(`Can't load save: wrong version`);
			throw new Error(`Can't load save from data: wrong version (${levelData.version})`);
		}
		level ??= new Level(levelData.name, engine, true);
		Object.assign(level, {
			date: new Date(levelData.date),
			bodies: new Map(),
			entities: new Map(),
			playerData: new Map(),
			...levelData.filter('id', 'name', 'versions', 'difficulty'),
		});

		for (let [id, data] of levelData.playerData) {
			level.playerData.set(
				id,
				new PlayerData({
					position: BABYLON.Vector3.FromArray(data.position),
					rotation: BABYLON.Vector3.FromArray(data.rotation),
					id,
					...data.filter('xp', 'xpPoints', 'tech'),
				})
			);
		}

		for (let id in levelData.bodies) {
			let bodyData = levelData.bodies[id];
			switch (bodyData.type) {
				case 'star':
					new Star({
						position: BABYLON.Vector3.FromArray(bodyData.position),
						color: BABYLON.Color3.FromArray(bodyData.color),
						scene: level,
						...bodyData.filter('name', 'radius', 'id'),
					});
					break;
				case 'planet':
					new Planet({
						position: BABYLON.Vector3.FromArray(bodyData.position),
						scene: level,
						...bodyData.filter('name', 'radius', 'id', 'biome', 'owner', 'rewards'),
					});
					break;
				default:
					new CelestialBody(bodyData.name, bodyData.id, level);
				//TODO: Change Star/Planet constructors to use standerdized data
			}
		}
		for (let entityData of levelData.entities) {
			switch (entityData.type) {
				case 'ship':
					Ship.FromData(entityData, level.bodies.get(entityData.owner) ?? level.playerData.get(entityData.owner), level);
					break;
				default:
					Entity.FromData(entityData, level.bodies.get(entityData.owner) ?? level.playerData.get(entityData.owner), level);
			}
		}
	}
};
export const commands = {
	help: () => {
		return 'See https://bs.drvortex.dev/docs/commands for command documentation';
	},
	kill: (level, selector) => {
		let entities = level.getEntities(selector);
		if (entities.constructor.name == 'Array') {
			entities.forEach(e => e.remove());
			return `killed ${entities.length} entities`;
		} else {
			entities.remove();
			return `killed entity #${entities.id} ("${entities.name}")`;
		}
	},
	spawn: (level, type, selector, x, y, z) => {
		let entity = level.getEntities(selector);
		let spawned = new Ship(type, entity, level);
		spawned.position.addInPlace(BABYLON.Vector3.FromArray(+x, +y, +z));
	},
	data: {
		get: (level, selector, path = '') => {
			let entityOrBody = level.getEntities(selector) ?? level.getBodies(selector);
			if (entityOrBody instanceof Array) throw new SyntaxError('passed selector can only return one entity or body');
			let data = entityOrBody.getByString(path),
				output = data;
			if (typeof data == 'object' || typeof data == 'function') {
				output = {};
				for (let p of Object.getOwnPropertyNames(data)) {
					output[p] = data[p];
				}
			}
			return `Data of entity #${entityOrBody.id}: ${output}`;
		},
		set: (level, selector, path, value) => {
			let entityOrBody = level.getEntities(selector) ?? level.getBodies(selector);
			if (entityOrBody instanceof Array) throw new SyntaxError('passed selector can only return one entity or body');
			entityOrBody.setByString(path, eval?.(value));
		},
	},
	tp: (level, selector, x, y, z) => {
		let entities = level.getEntities(selector),
			location = new BABYLON.Vector3(+x || 0, +y || 0, +z || 0); //TODO: || 0 -> || executor.position
		if (entities instanceof Array) {
			entities.forEach(entity => {
				entity.position = location;
				//TODO: properly implement with checks for ships
			});
			return `Teleported ${entities.length} to ${location.display()}`;
		} else {
			entities.position = location;
			return `Teleported entities #${entities.id} to ${location.display()}`;
		}
	},
};
export const runCommand = (command, level) => {
	if (!(level instanceof Level)) throw new TypeError('Failed to run command: no level selected');
	let splitCmd = command.split(' '),
		hasRun = false;
	let result =
		splitCmd
			.filter(p => p)
			.reduce(
				(o, p, i) =>
					typeof o?.[p] == 'function'
						? ((hasRun = true), o?.[p](level, ...splitCmd.slice(i + 1)))
						: hasRun
						? o
						: o?.[p]
						? o?.[p]
						: new ReferenceError('Command does not exist'),
				commands
			) ?? '';
	return result;
};
console.log(`Blankstorm Core (${versions.get(version).text}) loaded successfully`);
