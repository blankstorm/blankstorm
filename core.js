//core info and setup
const config = {
	mesh_segments: 32,
	render_quality: 0,
	load_remote_manifest: false,
	log_level: 'verbose'
};
const version = 'alpha_1.1.0',
versions = new Map(config.load_remote_manifest ? $.ajax({url: 'https://blankstorm.drvortex.dev/versions/manifest.json', async: false}).responseJSON : [
	['infdev_1', {text: 'Infdev 1', group: 'infdev'}],
	['infdev_2', {text: 'Infdev 2', group: 'infdev'}],
	['infdev_3', {text: 'Infdev 3', group: 'infdev'}],
	['infdev_4', {text: 'Infdev 4', group: 'infdev'}],
	['infdev_5', {text: 'Infdev 5', group: 'infdev'}],
	['infdev_6', {text: 'Infdev 6', group: 'infdev'}],
	['infdev_7', {text: 'Infdev 7', group: 'infdev'}],
	['infdev_8', {text: 'Infdev 8', group: 'infdev'}],
	['infdev_9', {text: 'Infdev 9', group: 'infdev'}],
	['infdev_10', {text: 'Infdev 10', group: 'infdev'}],
	['infdev_11', {text: 'Infdev 11', group: 'infdev'}],
	['infdev_12', {text: 'Infdev 12', group: 'infdev'}],
	['alpha_1.0.0', {text: 'Alpha 1.0.0', group: 'alpha'}],
	['alpha_1.1.0', {text: 'Alpha 1.1.0', group: 'alpha'}]
]);
const init = (options = config) => {

}

Math.clamp = (num, min, max) => Math.min(Math.max(num, min), max);
const greek = ["Alpha", "Beta", "Gamma", "Delta", "Epsilon", "Zeta", "Eta", "Theta", "Iota", "Kappa", "Lambda", "Mu", "Nu", "Xi", "Omicron", "Pi", "Rho", "Sigma", "Tau", "Upsilon", "Phi", "Chi", "Psi", "Omega"],
numeral = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI", "XXII", "XXIII", "XXIV", "XXV", "XXVII", "XXVII", "XXVIII", "XXIX", "XXX", "XXXI", "XXXII", "XXXIII", "XXXIV", "XXXV", "XXXVI", "XXXVII", "XXXVIII", "XXXIX", "XL", "XLI", "XLII", "XLIII", "XLIV", "XLV", "XLVI", "XLVII", "XLVIII", "XLIX", "L", "LI", "LII", "LIII", "LIV", "LV", "LVI", "LVII", "LVIII", "LIX", "LX", "LXI", "LXII", "LXIII", "LXIV", "LXV", "LXVI", "LXVII", "LXVIII", "nice", "LXX", "LXXI", "LXXII", "LXXIII", "LXXIV", "LXXV", "LXXVI", "LXXVII", "LXXVIII", "LXXIX", "LXXX", "LXXXI", "LXXXII", "LXXXIII", "LXXXIV", "LXXXV", "LXXXVI", "LXXXVII", "LXXXVIII", "LXXXIX", "XC", "XCI", "XCII", "XCIII", "XCIV", "XCV", "XCVI", "XCVII", "XCVIII", "XCIX", "C"],
minimize = number => {
	let n = number, l = ["", "K", "M", "B", "T", "q", "Q", "s", "S", "O", "N", "D"];
	if (typeof n != "number") { n = (+n) }
	if (n < 0 || n > (+`1e${(l.length - 1) * 3}`)) return n
	for (let i = 0; i < l.length; i++) {
		let d = (+`1e${i * 3}`);
		if (n / d < 1000) { return ((n / d).toFixed() + l[i]) }
	}
},
range = (min, max) => { let a = []; for (let i = min; i < max; i++) { a.push(i) } return a };

BABYLON.Mesh.sizeOf = mesh => {
	if (typeof mesh.getHierarchyBoundingVectors != 'function') throw new TypeError('parameter is not a Mesh');
	const sizes = mesh.getHierarchyBoundingVectors();
	return sizes.max.subtract(sizes.min);
};

//utility functions
const isHex = str => /^[0-9a-f-\.]+$/.test(str),
isJSON = str => {
	try {
		JSON.parse(str);
		return true
	} catch (e) {
		return false
	}
},
isCraftable = obj => typeof obj?.recipe == 'object' && typeof obj?.requires == 'object' && typeof obj?.buildTime == 'numbers' && isNaN(obj?.buildTime),
wait = time => new Promise(res => setTimeout(res, time * 1000));
const random = {
	float: (min = 0, max = 1) => Math.random() * (max - min) + min,
	hex: (length = 1) => { let s = ""; for (let i = 0; i < length; i++) { s += Math.floor(Math.random() * 16).toString(16) } return s; },
	get bool() { return !!Math.round(Math.random())},
	bin: (length = 1) => { let b = ""; for (let i = 0; i < length; i++) { b += Math.round(Math.random()) } return b; },
	int: (min = 0, max = 1) => Math.round(Math.random() * (max - min) + min),
	char: (len = 1, min = 33, max = 126) => { let s = ''; for (let i = 0; i < len; i++) { s += String.fromCharCode(random.int(min, max)) }; return s },
	cords: (dis = 1, y0) => {
		let angle = Math.random() * Math.PI * 2,
			angle2 = Math.random() * Math.PI * 2;
		return y0 ? new BABYLON.Vector3(dis * Math.cos(angle), 0, dis * Math.sin(angle)) : new BABYLON.Vector3(dis * Math.cos(angle), dis * Math.sin(angle) * Math.cos(angle2), dis * Math.sin(angle) * Math.sin(angle2))
	},
}
const generate = {
	enemies: power => {//enemy spawning algorithm
		let e = [], p = [];
		for (let i in Ship.generic) { Ship.generic[i].enemy ? p.push(Ship.generic[i].power) : 0 }
		p.sort((c1, c2) => { if (c1 > c2) { return -1 } else if (c2 > c1) { return 1 } else { return 0 } });
		for (let i = 0; i < p.length; i++) { for (let j in Ship.generic) { (p[i] == Ship.generic[j].power) ? p[i] = j : 0 } }
		for (let i = 0; i < p.length; i++) {
			for (let j = 0; j < Math.floor(power / Ship.generic[p[i]].power); j++) {
				e.push(p[i]); power -= Ship.generic[p[i]].power
			}
		}
		e.power = power;
		return e
	},
	items: (quantity = 0, rares) => {
		let q = quantity;
		let r = {};
		for (let i in item) {
			(item.get(i).rare) ? (Math.random() < item.get(i).drop && rares) ? r[i] = quantity / item.get(i).value : r[i] = 0 : r[i] = quantity / item.get(i).value;
		}
		return r;
	}
};

//custom stuff
Object.defineProperty(Object.prototype, 'filter', {
	value: function(...keys){
		return Object.fromEntries(Object.entries(this).filter(([key, value]) => keys.includes(key)));
	}
});
Object.assign(BABYLON.Vector3.prototype, {
	abs(){return new BABYLON.Vector3(Math.abs(this.x), Math.abs(this.y), Math.abs(this.z))},
	toFixed(num = 1){return new BABYLON.Vector3(this.x.toFixed(num), this.y.toFixed(num), this.z.toFixed(num))},
	round(){return new BABYLON.Vector3(Math.round(this.x), Math.round(this.y), Math.round(this.z))},
	toPolar(){return Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2)},
	display(mode = 'xyz', ...options){
		return mode == 'xyz' ? `(${this.x}, ${this.y}, ${this.z})` :
		mode == 'xy' ? `(${this.x}, ${this.y})` :
		mode == 'xz' ? `(${this.x}, ${this.z})` :
		mode == 'yz' ? `(${this.y}, ${this.z})` :
		new SyntaxError('Vector3().display: Invalid mode: ' + mode);
	},
	worldToScreen(scene = game.scene(), width, height){
		return BABYLON.Vector3.Project(this, BABYLON.Matrix.Identity(), scene.getTransformMatrix(), {x: 0, y: 0, width, height});
	},
	
});
Object.assign(BABYLON.Vector3, {
	screenToWorld(x, y, width, height, depth, scene){
		return BABYLON.Vector3.Unproject(new BABYLON.Vector3(x, y, depth), width, height, BABYLON.Matrix.Identity(), scene.getViewMatrix(), scene.getProjectionMatrix());
	},
	screenToWorldPlane(x, y, scene){
		return scene.pick(x, y, mesh => mesh == scene.xzPlane).pickedPoint;
	},
	getRotation(origin, target){
		let diff = target.subtract(origin),
		distance = Math.sqrt(diff.x**2 + diff.y**2 + diff.z**2),
		phi = Math.acos(diff.z / distance) || 0,
		theta = Math.asin(diff.y / (Math.sin(phi) * distance)) || 0;
		return new BABYLON.Vector3(theta, Math.sign(diff.x||1) * phi, 0);
	}
});
Object.assign(BABYLON.Vector2.prototype, {
	display(){return `(${this.x}, ${this.y})`;},
	abs(){return new BABYLON.Vector2(Math.abs(this.x), Math.abs(this.y))},
	round(){return new BABYLON.Vector2(Math.round(this.x), Math.round(this.y))},
});
Object.defineProperty(Array.prototype, 'spliceOut', {
	value: function(element){
		let i = this.indexOf(element);
		if(i != -1) this.splice(i, 1);
		return i != -1;
	}
});

const item = new Map([
	['metal', { rare: false, value: 1}],
	['minerals', { rare: false, value: 2}],
	['fuel', { rare: false, value: 4}],
	['ancient_tech', { rare: true, drop: 0.1, value: 1000}],
	['code_snippets', { rare: true, drop: 0.1, value: 1000}]
]);
const tech = new Map([
	['armor', { recipe: { metal: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {}}],
	['laser', { recipe: { minerals: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {}}],
	['reload', { recipe: { metal: 4000, minerals: 1500 }, xp: 1, scale: 1.2, max: 10, requires: {}}],
	['thrust', { recipe: { fuel: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {}}],
	['energy', { recipe: { fuel: 5000, minerals: 1000 }, xp: 1, scale: 1.5, max: 25, requires: {}}],
	['shields', { recipe: { metal: 2500, minerals: 5000 }, xp: 1, scale: 1.5, max: 10, requires: { armor: 5 }}],
	['storage', { recipe: { metal: 10000, minerals: 10000, fuel: 10000}, xp: 2, scale: 10, requires: {}}],
	['missle', { recipe: { metal: 10000, minerals: 1000, fuel: 5000 }, xp: 1, scale: 1.5, max: 25, requires: { laser: 5 }}],
	['regen', { recipe: { metal: 50000, minerals: 10000, fuel: 10000 }, xp: 1, scale: 1.5, max: 25, requires: { reload: 5, armor: 15 }}],
	['build', { recipe: { metal: 100000 }, xp: 2, scale: 1.5, max: 50, requires: { armor: 10, thrust: 10, reload: 10 }}],
	['salvage', { recipe: { metal: 250000, minerals: 50000, fuel: 100000 }, xp: 5, scale: 1.25, max: 25, requires: { build: 5 }}]
]);


tech.priceOf = type => {
	let recipe = { ...tech.get(type).recipe };
	for (let p in tech.get(type).recipe) {
		for (let i = 1; i < player.data().tech[type]; i++) {
			recipe[p] *= tech.get(type).scale
		};
	}
	return recipe
};
tech.isLocked = type => {
	for (let i in tech.get(type).requires) {
		if ((tech.get(type).requires[i] > 0 && player.data().tech[i] < tech.get(type).requires[i]) || (tech.get(type).requires[i] == 0 && player.data().tech[i] > 0)) {
			return true
		}
	}
	return false
};

const Path = class extends BABYLON.Path3D{
	static Node = class{
		position = BABYLON.Vector3.Zero();
		parent = null;
		constructor(...args){
			this.position = args[0] instanceof BABYLON.Vector3 ? args[0].round() : new BABYLON.Vector3(args[0], args[1]), args[2];
			if(args[1] instanceof Path.Node) this.parent = args[1];
			if(args.at(-1) instanceof Path.Node) this.parent = args.at(-1);
		}
		gCost = 0;
		hCost = 0;
		intersects = [];
		heapIndex = null;
		get fCost(){
			return this.gCost + this.hCost;
		}
		equals(node){
			return this.position.equals(node.position)
		}
	}
	static nodeDistance(nodeA, nodeB){
		if(!(nodeA instanceof Path.Node && nodeB instanceof Path.Node)) throw new TypeError('passed nodes must be path.Node');
		let distance = nodeA.position.subtract(nodeB.position).abs();
		return Math.SQRT2 * (distance.x > distance.z ? distance.z : distance.x) + (distance.x > distance.z ? 1 : -1) * (distance.x - distance.z);
	}
	static trace(startNode, endNode){
		let path = [], currentNode = endNode;
		while(!currentNode.equals(startNode)){
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
	constructor(start, end, scene){
		super([]);
		try{
		if(!(start instanceof BABYLON.Vector3)) throw new TypeError('Start must be a Vector');
		if(!(end instanceof BABYLON.Vector3)) throw new TypeError('End must be a Vector');
		this.startNode = new Path.Node(start);
		this.endNode = new Path.Node(end);
		this.openNodes.push(this.startNode);
		while(!this.#pathFound && this.openNodes.length > 0 && this.openNodes.length < 1e4 && this.closedNodes.length < 1e4){
			let currentNode = this.openNodes.reduce((previous, current) => previous.fCost < current.fCost || (previous.fCost == current.fCost && previous.hCost > current.hCost) ? previous : current, this.openNodes[0]);
			this.openNodes.splice(this.openNodes.findIndex(node => node == currentNode), 1);
			this.closedNodes.push(currentNode);
			if(currentNode.equals(this.endNode)){
				this.endNode = currentNode;
				this.path = Path.trace(this.startNode, this.endNode);
				this.#pathFound = true;
			}
			let relatives = [0,1,-1].flatMap(x => [0,1,-1].map(y => new BABYLON.Vector3(x, 0, y))).filter(v => v.x != 0 || v.z != 0);
			let neighbors = relatives.map(v => this.openNodes.some(node => node.position.equals(v)) ? this.openNodes.find(node => node.position.equals(v)) : new Path.Node(currentNode.position.add(v), currentNode));
			for(let neighbor of neighbors){
				if(scene instanceof Level){
					scene.bodies.forEach(body => {
						if(BABYLON.Vector3.Distance(body.position, neighbor.position) <= body.radius + 1) neighbor.intersects.push(body);
					});
				}
				if(!neighbor.intersects.length && !this.closedNodes.some(node => node.equals(neighbor))){
					let costToNeighbor = currentNode.gCost + Path.nodeDistance(currentNode, neighbor);
					if(costToNeighbor < neighbor.gCost || !this.openNodes.some(node => node.equals(neighbor))){
						neighbor.gCost = costToNeighbor;
						neighbor.hCost = Path.nodeDistance(neighbor, this.endNode);
						if(!this.openNodes.some(node => node.equals(neighbor))) this.openNodes.push(neighbor);
					}
				}	
			}
		}
		}catch(e){
			throw e.stack
		}
	}
	drawGizmo(scene, color = BABYLON.Color3.White(), y = 0){
		if(!(scene instanceof BABYLON.Scene)) throw new TypeError('scene must be a scene');
		if(this.gizmo) console.warn('Path gizmo was already drawn!');
		this.gizmo = BABYLON.Mesh.CreateLines('pathGizmo.' + random.hex(16), this.path.map(node => node.position), scene);					
		this.gizmo.color = color;
		return this.gizmo;
	}
	disposeGizmo(){
		if(this.gizmo){
			this.gizmo.dispose();
			this.gizmo = null;
		}
	}
}
const StorageData = class extends Map{
	constructor({max = 1, items = {}}){
		super(Object.keys(item).map(i => [i, 0]));
		this.baseMax = max;
		Object.entries(items).forEach(args => this.add(...args));
	}
	get max(){
		return this.baseMax * (1 + player.data().tech.storage / 20)
	}
	get total(){
		return [...this.entries()].reduce((total, [name, amount]) => total + amount * item.get(name).value, 0);
	}
	empty(filter){
		for(let name of this.keys()){
			if((filter instanceof Array ? filter.includes(name) : filter == name) || !filter) this.set(name, 0);
		}
	}
	serialize(){
		return {items: Object.fromEntries([...this]), max: this.baseMax};
	}
	add(item, amount){
		this.set(item, this.get(item) + amount);
	}
	remove(item, amount){
		this.set(item, this.get(item) - amount);
	}
};
const PlayerData = class extends BABYLON.TransformNode{
	get items(){
		let items = {};
		Object.keys(item).forEach(item => {
			items[item] = 0;
			this.fleet.forEach(ship => {
				items[item] += ship.storage.get(item);
			});
		});
		return items;
	}

	set items(value){
		this.fleet.forEach(ship => {
			ship.storage.empty(Object.keys(value));
		});
		this.addItems(value);
	}
	addItems(items){
		this.fleet.forEach(ship => {
			let space = ship.storage.max - ship.storage.total;
			if(space > 0){
				Object.entries(items).forEach(([item, amount]) => {
					let stored = Math.min(space, amount);
					ship.storage.add(item, stored)
					items[item] -= stored;
					space -= stored;
				});
			}
		});
	}
	removeItems(items){
		this.fleet.forEach(ship => {
			Object.entries(items).forEach(([item, amount]) => {
				let stored = Math.min(ship.storage.get(item), amount);
				ship.storage.remove(item, stored)
				items[item] -= stored;
			});
		});
	}
	removeAllItems(){
		this.removeItems(Object.fromEntries([...item.keys()].map(i => [i, Infinity])));
	}
	hasItems(items){
		this.fleet.forEach(ship => {
			Object.entries(items).forEach(([item, amount]) => {
				let stored = Math.min(ship.storage.get(item), amount);
				items[item] -= stored;
			});
		});
		return Object.values(items).every(item => item <= 0);
	}
	get totalItems(){
		return this.fleet.reduce((total, ship) => total + ship.storage.total, 0)
	}
	get maxItems(){
		return this.fleet.reduce((total, ship) => total + ship.storage.max, 0);
	}
	shipNum(type){
		return this.fleet.reduce((total, ship) => total + ship.type == type ? 1 : 0, 0)
	}
	tech = Object.fromEntries([...tech.keys()].map(item => [item, 0]));
	fleet = [];
	xp = 0;
	xpPoints = 0;
	velocity = BABYLON.Vector3.Zero();
	get power(){
		return this.fleet.reduce((a, ship) => a + ship.power, 0);
	}
	constructor(data, level){
		if(!(level instanceof Level) && level) throw new TypeError('passed level not a Level');
		super(data.name);
		this.position = random.cords(random.int(0, 50), true).add(new BABYLON.Vector3(0, 0, -1000));
		this.rotation.z = Math.PI;
		Object.assign(this, data);
	}
}
const Entity = class extends BABYLON.TransformNode{
	static generic = new Map();
	static loadType(data){
		Entity.generic.set(data.id, {
			...data,
			model: null
		});
	}
	_generic = {speed: 1}
	async #createInstance(type){
		await this.#save.loadedEntityMeshes;
		if(typeof this.#save.genericEntities[type]?.instantiateModelsToScene == 'function'){
			this.mesh = this.#save.genericEntities[type].instantiateModelsToScene().rootNodes[0];
			this.mesh.setParent(this);
			this.mesh.position = BABYLON.Vector3.Zero(); 
		}else{
			this.mesh = BABYLON.MeshBuilder.CreateBox('error_mesh', {size: 1}, this.#save);
			this.mesh.material = new BABYLON.StandardMaterial('error_material', this.#save);
			this.mesh.material.emissiveColor = BABYLON.Color3.Red();
			this.mesh.setParent(this);
			this.mesh.position = BABYLON.Vector3.Zero();
			throw 'Origin mesh does not exist';
		}
	}
	#save;
	constructor(type, owner, save, id = random.hex(32)){
		if(!(save instanceof Level)) throw new TypeError('passed save must be a level');
		super();
		this.id = id;
		this.owner = owner;
		this.#save = save;
		this.#createInstance(type).catch(err => console.warn(`Failed to create entity mesh instance for #${id} of type ${type} owned by ${owner?.name ?? owner}: ${err}`));
		save.entities.set(this.id, this);
	}
	remove(){
		this.mesh.dispose();
		this.getScene().entities.delete(this.id);
	}
	toString(){
		return `Entity #${this.id}`
	}
	followPath(path){
		if(!(path instanceof Path)) throw new TypeError('path must be a Path');
		return new Promise(resolve => {
			let animation = new BABYLON.Animation('pathFollow', 'position', 60 * this._generic.speed, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT),
			rotateAnimation = new BABYLON.Animation('pathRotate', 'rotation', 60 * this._generic.agility, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT);
			
			animation.setKeys(path.path.map((node, i) => ({frame: i * 60 * this._generic.speed, value: node.position})));
			rotateAnimation.setKeys(path.path.flatMap((node, i) => {
				if(i != 0){
					let value = BABYLON.Vector3.getRotation(path.path[i - 1].position, node.position);
					return [
						{frame: i * 60 * this._generic.agility - 30, value},
						{frame: i * 60 * this._generic.agility - 10, value}
					]
				}else{
					return [{frame: 0, value: this.rotation}];
				}
			}));

			this.animations.push(animation);
			this.animations.push(rotateAnimation);

			let result = this.#save.beginAnimation(this, 0, path.path.length * 60);
			result.disposeOnEnd = true;
			result.onAnimationEnd = resolve;
		});
	}
	moveTo(location, isRelative){
		if(!(location instanceof BABYLON.Vector3)) throw new TypeError('location must be a Vector3');
		if(this.currentPath && debug.show_path_gizmos) this.currentPath.disposeGizmo();
		this.currentPath = new Path(this.position, location.add(isRelative ? this.position : BABYLON.Vector3.Zero()), this.#save);
		if(debug.show_path_gizmos) this.currentPath.drawGizmo(this.#save, BABYLON.Color3.Green());
		this.followPath(this.currentPath).then(path => {
			if(debug.show_path_gizmos && this.currentPath){
				this.currentPath.disposeGizmo();
			}
		});
	}
	warpTo(location, isRelative){
		if(!(location instanceof BABYLON.Vector3)) throw new TypeError('location must be a Vector3');
		
	}
}
const Ship = class extends Entity{
	static generic = {
		corvette: {
			hp: 10, damage: 0.1, reload: 0.5, maxLevel: 5, speed: 2, agility: 2, range: 125,
			power: 1, enemy: true, camRadius: 10, xp: 5, storage: 100,
			critChance: 0.1, critDamage: 1.5,
			recipe: { metal: 1000, minerals: 500, fuel: 250 },
			requires: {}, model: 'models/corvette.gltf'
		},
		frigate: {
			hp: 25, damage: 0.5, reload: 1, maxLevel: 5, speed: 1, agility: 1.5, range: 150,
			power: 2, enemy: true, camRadius: 15, xp: 7.5, storage: 250,
			critChance: 0.25, critDamage: 1.25,
			recipe: { metal: 2000, minerals: 2000, fuel: 500 },
			requires: {}, model: 'models/corvette.gltf'
		},
		transport_small: {
			hp: 5, damage: 0.1, reload: 5, maxLevel: 1, speed: 1, agility: .75, range: 75,
			power: 1, enemy: false, camRadius: 20, xp: 10, storage: 25000,
			critChance: 0.1, critDamage: 1,
			recipe: { metal: 5000, minerals: 1000, fuel: 2500},
			requires: {storage: 3}, model: 'models/transport_small.glb'
		},
		cruiser: {
			hp: 50, damage: 1, reload: 2, maxLevel: 5, speed: 1, agility: 1, range: 200,
			power: 5, enemy: true, camRadius: 20, xp: 10, storage: 250,
			critChance: 0.1, critDamage: 1.25,
			recipe: { metal: 4000, minerals: 1000, fuel: 1000 },
			requires: {}, model: 'models/cruiser.gltf'
		},
		destroyer: {
			hp: 100, damage: 2.5, reload: 1, maxLevel: 5, speed: 1, agility: 1, range: 200,
			power: 10, enemy: true, camRadius: 30, xp: 20, storage: 1000,
			critChance: 0.25, critDamage: 1.5,
			recipe: { metal: 10000, minerals: 4000, fuel: 2500 },
			requires: {}, model: 'models/destroyer.gltf'
		},
		transport_medium: {
			hp: 50, damage: 1, reload: 5, maxLevel: 1, speed: 2/3, agility: 0.5, range: 75,
			power: 10, enemy: false, camRadius: 50, xp: 10, storage: 100000,
			critChance: 0.1, critDamage: 1,
			recipe: { metal: 10000, minerals: 2000, fuel: 5000},
			requires: {storage: 5}, model: 'models/transport_small.glb'
		},
		battleship: {
			hp: 250, damage: 10, reload: 2, maxLevel: 5, speed: 2/3, agility: 1, range: 250,
			power: 25, enemy: true, camRadius: 40, xp: 50, storage: 2500,
			critChance: 0.2, critDamage: 1.25,
			recipe: { metal: 25000, minerals: 10000, fuel: 5000 },
			requires: {}, model: 'models/battleship.gltf'
		},
		dreadnought: {
			hp: 2000, damage: 100, reload: 4, maxLevel: 5, speed: 1/3, agility: 1, range: 250,
			power: 100, enemy: true, camRadius: 65, xp: 100, storage: 10000,
			critChance: 0.2, critDamage: 1.5,
			recipe: { metal: 1000000, minerals: 500000, fuel: 250000 },
			requires: { build: 5 }, model: 'models/dreadnought.gltf'
		}
	}
	constructor(typeOrData, faction, save){
		if(!(faction instanceof PlayerData)) window.args = arguments;
		if(!Ship.generic[typeOrData] && !(isJSON(typeOrData) && Ship.generic[typeOrData.shipType])) throw new ReferenceError(`Ship type ${typeOrData} does not exist`);
		if(typeof typeOrData == 'object'){
			super(typeOrData.shipType, faction, save ?? faction.getScene(), typeOrData.id);
			Object.assign(this, {
				type: typeOrData.shipType,
				position: BABYLON.Vector3.FromArray(typeOrData.position),
				rotation: BABYLON.Vector3.FromArray(typeOrData.rotation),
				storage: new StorageData({max: Ship.generic[typeOrData.shipType].storage, items: typeOrData.storage}),
				velocity: BABYLON.Vector3.Zero(),
				hp: +typeOrData.hp,
				_generic: Ship.generic[typeOrData.shipType]
			})
		}else{
			super(typeOrData, faction, save ?? faction.getScene());
			Object.assign(this, {
				velocity: BABYLON.Vector3.Zero(),
				position: faction.position.add(random.cords(random.int(1, faction.power))), // Will be changed to shipyard location
				storage: new StorageData({max: Ship.generic[typeOrData].storage}),
				type: typeOrData,
				hp: Ship.generic[typeOrData].hp,
				_generic: Ship.generic[typeOrData]
			});
		}

		if(faction?.fleet instanceof Array){
			faction.fleet.push(this);
		}

	}
	remove(){
		this.dispose();
		this.owner.fleet.spliceOut(this);
		this.getScene().entities.delete(this.id);
	}
	//this will be replaced with hardpoints!
	attack(body){
		if(!(body instanceof CelestialBody) && !(body instanceof PlayerData)) throw new TypeError('body must be a CelestialBody or PlayerData');
		let possibleTargets = body.fleet.filter(enemy => BABYLON.Vector3.Distance(this.position, enemy.position) < this_generic.range);
		let target = possibleTargets[random.int(0, possibleTargets.length - 1)];
		if(target){
			let laser = Mesh.CreateLines("laser." + random.hex(16), [this.mesh.getAbsolutePosition().add(Vector3.Up()).add(random.cords(1)), target.mesh.getAbsolutePosition().add(Vector3.Up()).add(random.cords(1))], body.getScene());
			laser.color = this.owner == player.data() ? BABYLON.Color3.Teal() : BABYLON.Color3.Red();
			target.hp -= this._generic.damage / 60 * body.getScene().getAnimationRatio() * !!(Math.random() < this._generic.critChance) ? this._generic.critDamage : 1;
			setTimeout(e => laser.dispose(), this.reload * 10);
		}
	}
}
const CelestialBodyMaterial = class extends BABYLON.ShaderMaterial{
	static updateRandom(texture){
		if(!(texture instanceof BABYLON.DynamicTexture)) throw new TypeError(`Can't update texture: not a dynamic texture`);
		let context = texture.getContext(),
		imageData = context.getImageData(0, 0, 512, 512);
		for(let i = 0; i < 1048576; i++){
			imageData.data[i] = (Math.random() * 256) | 0
		}
		context.putImageData(imageData, 0, 0);
		texture.update();
	}
	generateTexture(id, path, options, scene){
		let sampler = new BABYLON.DynamicTexture('CelestialBodyMaterial.sampler.' + id, 512, scene, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
		CelestialBodyMaterial.updateRandom(sampler);
		let texture = new BABYLON.ProceduralTexture('CelestialBodyMaterial.texture.' + id, options.mapSize, path, scene, null, true, true);
		texture.setColor3('upperColor', options.upperColor);
		texture.setColor3('lowerColor', options.lowerColor);
		texture.setFloat('mapSize', options.mapSize);
		texture.setFloat("maxResolution", options.maxResolution);
		texture.setFloat("seed", options.seed);
		texture.setVector2("lowerClamp", options.lowerClamp);
		texture.setTexture("randomSampler", sampler);
		texture.setVector2("range", options.range);
		texture.setVector3("options", options.options);
		texture.refreshRate = 0;
		return texture
	}
	constructor(options, scene){
		options.mapSize = 1024;
		options.maxResolution = [64, 256, 1024][config.render_quality];
		let id = random.hex(8);
		super('CelestialBodyMaterial.' + id, scene, './shader/planet', {
			attributes: ["position", "normal", "uv"],
			uniforms: ["world", "worldView", "worldViewProjection", "view", "projection"],
			needAlphaBlending: true
		});
		this.generationOptions = options;
		this.rotationFactor = Math.random();
		this.matrixAngle = 0;

		this.setVector3('cameraPosition', player.cam.position);
		this.setVector3('lightPosition', BABYLON.Vector3.Zero());
		
		this.noiseTexture = this.generateTexture(id, './shader/noise', {...options, options: new BABYLON.Vector3(options.directNoise ? 1.0 : 0, options.lowerClip.x, options.lowerClip.y)}, scene);
		this.setTexture("textureSampler", this.noiseTexture);

		this.cloudTexture = this.generateTexture(id, './shader/cloud', {...options, options: new BABYLON.Vector3(1.0, 0, 0)}, scene);
		this.setTexture("cloudSampler", this.cloudTexture);

		this.setColor3("haloColor", options.haloColor);
	}
}
const CelestialBody = class extends BABYLON.Mesh {
	fleet = [];
	owner = null;
	fleetLocation = BABYLON.Vector3.Zero();
	constructor(name, id = random.hex(32), level){
		if(!(level instanceof Level)) throw new TypeError('level must be a Level')
		super(name, level);
		this.id = id;
		level.bodies.set(id, this)
	}
	remove(){
		this.dispose();
		this.getScene().bodies.delete(this.id);
	}
}
const Star = class extends CelestialBody{
	constructor({name, position = BABYLON.Vector3.Zero(), radius = 1, color = BABYLON.Color3.Gray(), scene, id}) {
		super(name ?? 'Unknown Star', id, scene);
		BABYLON.CreateSphereVertexData({ diameter: radius*2, segments: config.mesh_segments }).applyToMesh(this);
		Object.assign(this, {
			position,
			light: Object.assign(
				new BABYLON.PointLight(this.id + ".light", position, scene),
				{intensity: 1, range: 10000}
			),
			material: Object.assign(new BABYLON.StandardMaterial(this.id + ".mat", scene), {
				//emissiveTexture: new NoiseProceduralTexture(this.id + ".texture", config.mesh_segments, scene),
				emissiveColor: color,
				disableLighting: true
			}),
			radius,
			color,
			isStar: true,
		});
		//Object.assign(s.material.emissiveTexture, {animationSpeedFactor: 0.1, octaves: 8, persistence:0.8});
		//s.material.Fragment_Before_FragColor(`color = vec4(vec3(color.xyz),1.0);`);
	}
}
const Planet = class extends CelestialBody {
	static biomes = new Map([
		['earthlike', {
			clouds: false, //true,
			upperColor: new BABYLON.Color3(0.2, 2.0, 0.2),
			lowerColor: new BABYLON.Color3(0, 0.2, 1.0),
			haloColor: new BABYLON.Color3(0, 0.2, 1.0),
			maxResolution: [64, 256, 1024][settings.render_quality],
			seed: 0.30,
			cloudSeed: 0.6,
			lowerClamp: new BABYLON.Vector2(0.6, 1),
			groundAlbedo: 1.25,
			cloudAlbedo: 0,
			directNoise: false,
			lowerClip: new BABYLON.Vector2(0, 0),
			range: new BABYLON.Vector2(0.3, 0.35),
			icon: 'earth-americas'
		}],
		['volcanic', {
			upperColor: new BABYLON.Color3(0.9, 0.45, 0.45),
			lowerColor: new BABYLON.Color3(1.0, 0, 0),
			haloColor: new BABYLON.Color3(1.0, 0, 0.3),
			seed: 0.30,
			cloudSeed: 0.60,
			clouds: false,
			lowerClamp: new BABYLON.Vector2(0, 1),
			maxResolution: 256,
			cloudAlbedo: 0,
			groundAlbedo: 1.0,
			directNoise: false,
			lowerClip: new BABYLON.Vector2(0, 0),
			range: new BABYLON.Vector2(0.3, 0.4),
			icon: 'planet-ringed'
		}],
		['jungle', {
			upperColor: new BABYLON.Color3(0.1, 0.3, 0.7),
			lowerColor: new BABYLON.Color3(0, 1.0, 0.1),
			haloColor: new BABYLON.Color3(0.5, 1.0, 0.5),
			seed: 0.40,
			cloudSeed: 0.70,
			clouds: false, //true,
			lowerClamp: new BABYLON.Vector2(0, 1),
			maxResolution: 512,
			cloudAlbedo: 1.0,
			groundAlbedo: 1.1,
			directNoise: false,
			lowerClip: new BABYLON.Vector2(0, 0),
			range: new BABYLON.Vector2(0.2, 0.4),
			icon: 'earth-americas'
		}],
		['ice', {
			upperColor: new BABYLON.Color3(1.0, 1.0, 1.0),
			lowerColor: new BABYLON.Color3(0.7, 0.7, 0.9),
			haloColor: new BABYLON.Color3(1.0, 1.0, 1.0),
			seed: 0.80,
			cloudSeed: 0.40,
			clouds: false, //true,
			lowerClamp: new BABYLON.Vector2(0, 1),
			maxResolution: 256,
			cloudAlbedo: 1.0,
			groundAlbedo: 1.1,
			directNoise: false,
			lowerClip: new BABYLON.Vector2(0, 0),
			range: new BABYLON.Vector2(0.3, 0.4),
			icon: 'planet-ringed'
		}],
		['desert', {
			upperColor: new BABYLON.Color3(0.9, 0.30, 0),
			lowerColor: new BABYLON.Color3(1.0, 0.5, 0.1),
			haloColor: new BABYLON.Color3(1.0, 0.5, 0.1),
			seed: 0.18,
			cloudSeed: 0.60,
			clouds: false,
			lowerClamp: new BABYLON.Vector2(0.3, 1),
			maxResolution: 512,
			cloudAlbedo: 1.0,
			groundAlbedo: 1.0,
			directNoise: false,
			lowerClip: new BABYLON.Vector2(0, 0),
			range: new BABYLON.Vector2(0.3, 0.4),
			icon: 'planet-ringed'
		}],
		['islands', {
			upperColor: new BABYLON.Color3(0.4, 2.0, 0.4),
			lowerColor: new BABYLON.Color3(0, 0.2, 2.0),
			haloColor: new BABYLON.Color3(0, 0.2, 2.0),
			seed: 0.15,
			cloudSeed: 0.60,
			clouds: false, //true,
			lowerClamp: new BABYLON.Vector2(0.6, 1),
			maxResolution: 512,
			cloudAlbedo: 1.0,
			groundAlbedo: 1.2,
			directNoise: false,
			lowerClip: new BABYLON.Vector2(0, 0),
			range: new BABYLON.Vector2(0.2, 0.3),
			icon: 'earty-oceania'
		}],
		['moon', {
			upperColor: new BABYLON.Color3(2.0, 1.0, 0),
			lowerColor: new BABYLON.Color3(0, 0.2, 1.0),
			haloColor: new BABYLON.Color3(0, 0.2, 1.0),
			cloudSeed: 0.6,
			lowerClamp: new BABYLON.Vector2(0.6, 1),
			cloudAlbedo: 0.9,
			lowerClip: new BABYLON.Vector2(0, 0),
			range: new BABYLON.Vector2(0.3, 0.35),
			haloColor: new BABYLON.Color3(0, 0, 0),
			seed: 0.5,
			clouds: false,
			groundAlbedo: 0.7,
			directNoise: true,
			lowerClip: new BABYLON.Vector2(0.5, 0.9),
			icon: 'planet-ringed'
		}]
	]);
	get power(){
		//return this.fleet.reduce((total, ship) => total + ship.power, 0) || 0
		return 1
	}
	constructor({name, position = BABYLON.Vector3.Zero(), biome = 'earthlike', radius = 1, owner = null, fleet = [], rewards = {}, scene, id}){
		super(name ?? 'Unknown Planet', id, scene);
		BABYLON.CreateSphereVertexData({ diameter: radius * 2, segments: config.mesh_segments }).applyToMesh(this);
		Object.assign(this, {
			owner, radius, rewards, biome, position,
			material: Planet.biomes.has(biome) ? new CelestialBodyMaterial(Planet.biomes.get(biome), scene) : new BABYLON.StandardMaterial('mat', scene)
		});
		this.fleetLocation = random.cords(random.int(radius + 5, radius * 1.2), true);
		for(let shipOrType of fleet){
			if(shipOrType instanceof Ship){
				this.fleet.push(shipOrType);
			}else{
				let ship = new Ship(shipOrType, this, scene);
				ship.position.addInPlace(this.fleetLocation);
			}
		}
	}
}

const Station = class extends CelestialBody{
	constructor({name = 'Station', id = random.hex(32)}, scene){
		super(name, id, scene);
	}
}
const Level = class extends BABYLON.Scene {
	static upgrades = new Map([
		['infdev_11', data => ({...data, version: 'alpha_1.0.0'})],
		['infdev_12', data => ({...data, version: 'alpha_1.0.0'})],
		//['alpha_1.0.0', data => ({...data})]
	]);
	static upgrade(data){
		while(version != data.version && Level.upgrades.has(data.version)){
			data = Level.upgrades.get(data.version)(data);
			if(version != data.version && !Level.upgrades.has(data.version)){
				alert(`Can't upgrade save from ${versions.get(data.version).text} to ${versions.get(version).text}.`);
			}
		}
		return data;
	}
	static system = {
		names: ["Abrigato", "Kerali", "Kaltez", "Suzum", "Vespa", "Coruscare", "Vulca", "Jaeger", "Kashyyyk", "Outpost42", "Victoria", "Gesht", "Sanctuary", "Snowmass", "Ja", "Keeg", "Haemeiguli", "Borebalae", "Albataetarius", "Hataerius", "Achernaiphoros", "Antadrophei", "Hoemeirai", "Antabalis", "Hoereo", "Pazadam", "Equidor", "Pax", "Xena", "Titan", "Oturn", "Thuamia", "Heuthea", "Ditharus", "Muxater", "Trukovis", "Bichotune", "Etis", "Leorus", "Aphus", "Harophos", "Athena", "Hades", "Icarus", "Ureus", "Xentos Prime", "Ketlak", "Aerox", "Thryox", "Stratus", "Nox", "Sanctum", "Pastūra", "Tinctus", "Morbus", "Neos", "Nomen", "Numerus", "Pax", "Fornax", "Skorda", "Alli", "Resurs", "Home"],
		size: 5000,
		maxPlanets: 9
	}
	static generate = {
		system: (name, position, level) => {
			let star = new Star({
				name,
				position,
				radius: random.int(300, 500),
				color: new BABYLON.Color3(Math.random() ** 3 / 2 + random.float(0.3, 0.4), Math.random() ** 3 / 2 + random.float(0.3, 0.4), Math.random() ** 3 / 2 + random.float(0.3, 0.4)),
				scene: level
			})
			let nameMode = random.bool,
			planetNum = random.int(1, Level.system.maxPlanets),
			names = random.bool ? greek.slice(0, planetNum) : range(1, planetNum + 1),
			planets = [];
			for (let i in names) {
				let planetName = nameMode ? names[i] + ' ' + name : name + ' ' + names[i], radius = random.int(25, 50);
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
		}
	}
	id = random.hex(16)
	name = '';
	version = version;
	date = new Date();
	difficulty = 1;
	clearColor = new BABYLON.Color3(0.8, 0.75, 0.85);
	genericEntities = {};
	bodies = new Map();
	entities = new Map();
	playerData = {};
	#initPromise = new Promise(res => {});
	loadedEntityMeshes = new Promise(res => {});
	async #loadEntityMeshes(){
		for(let i in Ship.generic){
			try{
			let container = this.genericEntities[i] = await SceneLoader.LoadAssetContainerAsync('', Ship.generic[i].model, this);
			Object.assign(container.meshes[0], {
				rotationQuaternion: null,
				material: Object.assign(container.materials[0], {
					realTimeFiltering: true,
					realTimeFilteringQuality: [2, 8, 32][+settings.render_quality],
					reflectionTexture: this.probe.cubeTexture
				}),
				position: Vector3.Zero(),
				isVisible: false,
				isPickable: false
			});
			this.probe.renderList.push(container.meshes[1]);
			}catch(err){
				console.error(`Failed to load model for ship type ${i} from ${Ship.generic[i].model}: ${err}`)
			}
		}
	}
	async init(name){
		this.name = name;
		let sys = await Level.generate.system('Crash Site', BABYLON.Vector3.Zero(), this);
	}
	async load(saveData){
		if(saveData.version != version){
			alert(`Can't load save: wrong version`);
			throw new Error(`Can't load save from data: wrong version (${saveData.version})`)
		}
		Object.assign(this, {
			date: new Date(saveData.date),
			bodies: new Map(),
			entities: new Map(),
			playerData: {},
			...saveData.filter('id', 'name', 'versions', 'difficulty')
		});
		
		for(let id in saveData.playerData){
			let data = {...saveData.playerData[id], id};
			this.playerData[id] = new PlayerData({
				position: BABYLON.Vector3.FromArray(data.position),
				rotation: BABYLON.Vector3.FromArray(data.rotation),
				id,
				...data.filter('xp', 'xpPoints', 'tech')
			});
		}

		for(let id in saveData.bodies){
			let bodyData = saveData.bodies[id], body;
			switch(bodyData.type){
				case 'star':
					body = new Star({
						position: BABYLON.Vector3.FromArray(bodyData.position),
						color: BABYLON.Color3.FromArray(bodyData.color),
						scene: this,
						...bodyData.filter('name', 'radius', 'id')
					});
				break;
				case 'planet':	
					body = new Planet({
						position: BABYLON.Vector3.FromArray(bodyData.position),
						scene: this,
						...bodyData.filter('name', 'radius', 'id', 'biome', 'owner', 'rewards')
					})
				break;
				default:
					body = new CelestialBody(bodyData.name, bodyData.id, this);
					//TODO: Change Star/Planet constructors to use standerdized data
			}
		}
		for(let entityData of saveData.entities){
			switch(entityData.type){
				case 'ship':
					new Ship(entityData, this.bodies.get(entityData.owner) ?? this.playerData[entityData.owner], this);
					break;
				default:
					new Entity(null, null, this);
			}
		}
	}
	async generateRegion(x, y, size){
		await this.ready();
	}
	async ready(){
		await Promise.allSettled([this.#initPromise, this.loadedEntityMeshes]);
		return this
	}
	get selectedEntities(){
		return [...this.entities.values()].filter(e => e.selected);
	}
	getPlayerData(nameOrID){
		return Object.entries(this.playerData).filter(([id, data]) => data.name == nameOrID || id == nameOrID)[0]?.[1]
	}
	getEntities(selector){
		if (typeof selector != 'string') throw new TypeError('getEntity: selector must be of type string');
		switch (selector[0]) {
			case '@':
				if(this.getPlayerData(selector.slice(1)) instanceof PlayerData){
					return this.getPlayerData(selector.slice(1))
				}else{
					console.warn(`Player ${selector} does not exist`);
				}
				break;
			case '*':
				return [...this.entities.values()];
				break;
			case '#':
				if(this.entities.has(selector.slice(1))){
					return this.entities.get(selector.slice(1))
				}else{
					console.warn(`Entity ${selector} does not exist`);
				}
				break;
		}
	}
	getBodies(selector){
		if (typeof selector != 'string') throw new TypeError('getBody: selector must be of type string');
		switch (selector[0]) {
			case '*':
				return [...this.bodies.values()]
				break;
			case '#':
				for(let [id, body] of this.bodies){
					if(id == selector.slice(1)) return body;
				}
				break;
		}
	}
	constructor(nameOrData, engine){
		super(engine);
		Object.assign(this, {
			skybox: BABYLON.Mesh.CreateBox('skybox', Level.system.size * 2, this),
			gl: Object.assign(new BABYLON.GlowLayer('glowLayer', this), { intensity: 0.9 }),
			hl: new BABYLON.HighlightLayer('highlight', this),
			xzPlane: BABYLON.MeshBuilder.CreatePlane('xzPlane', {size: Level.system.size * 2}, this),
			probe: new BABYLON.ReflectionProbe('probe', 256, this),
		});
		this.xzPlane.rotation.x = Math.PI / 2;
		this.xzPlane.setEnabled(false);
		this.skybox.infiniteDistance = true;
		this.skybox.isPickable = false;
		this.skybox.material = Object.assign(new BABYLON.StandardMaterial('skybox.mat', this), {
			backFaceCulling: false,
			disableLighting: true,
			reflectionTexture: BABYLON.CubeTexture.CreateFromImages(Array(6).fill('images/skybox.jpg'), this)
		});
		this.skybox.material.reflectionTexture.coordinatesMode = 5;
		
		this.loadedEntityMeshes = this.#loadEntityMeshes();
		this.#initPromise = isJSON(nameOrData) ? this.load(JSON.parse(nameOrData)) : this.init(nameOrData);
		this.registerBeforeRender(()=>{
			let ratio = this.getAnimationRatio();
			for(let [id, body] of this.bodies){
				if(body instanceof Planet && body.material instanceof CelestialBodyMaterial){
					body.rotation.y += 0.0001 * ratio * body.material.rotationFactor;
					body.material.setMatrix("rotation", Matrix.RotationY(body.matrixAngle));
					body.matrixAngle -= 0.0004 * ratio;
					body.material.setVector3("options", new Vector3(body.material.generationOptions.clouds, body.material.generationOptions.groundAlbedo, body.material.generationOptions.cloudAlbedo))
				}
			}
		});
	}
	serialize(){
		let data = {
			date: this.date.toJSON(),
			bodies: {},
			entities: [],
			playerData: {},
			...this.filter('difficulty', 'version', 'name', 'id')
		};
		for(let entity of this.entities.values()){
			if(!entity instanceof Entity){
				console.warn(`entity #${entity?.id} not saved: invalid type`);
			}else{
				let entityData = {
					position: entity.position.asArray().map(num => +num.toFixed(3)),
					rotation: entity.rotation.asArray().map(num => +num.toFixed(3)),
					owner: entity.owner?.id, 
					...entity.filter('name', 'id')
				};
				switch(entity.constructor.name){
					case 'Ship':
					Object.assign(entityData, {
						type: 'ship',
						shipType: entity.type,
						storage: entity.storage.serialize().items,
						hp: +entity.hp.toFixed(3)
					});
					break;
					default:
					Object.assign(entityData, {
						type: null,
						hp: 0,
						owner: null
					});
				}
				data.entities.push(entityData);
			}
		};

		for(let [id, body] of this.bodies){
			if(!body instanceof CelestialBody){
				console.warn(`body #${body?.id} not saved: invalid type`);
			}else{
				let bodyData = data.bodies[id] = {
					position: body.position.asArray().map(num => +num.toFixed(3)),
					fleetLocation: body.fleetLocation.asArray().map(num => +num.toFixed(3)),
					...body.filter('name', 'id', 'owner')
				};
				switch(body.constructor.name){
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
						radius: body.radius
					});
					break;
					default: bodyData.type = null;
				}
			}
		};
		for(let id in this.playerData){
			let playerData = this.playerData[id];
			data.playerData[id] = {
				position: playerData.position.asArray().map(num => +num.toFixed(3)),
				rotation: playerData.rotation.asArray().map(num => +num.toFixed(3)),
				fleet: playerData.fleet.map(s => s.id),
				...playerData.filter('tech', 'items', 'xp', 'xpPoints')
			}
		}
		return data;
	}
}
const commands = {
	help: () => {
		open(web`docs/commands`, 'target=_blank');
	},
	kill: (level, selector) => {
		let e = level.getEntities(selector);
		if(e.constructor.name == 'Array'){
			game.removeEntity(...e);
			return `killed ${e.length} entities`;
		}else{
			game.removeEntity(e);
			return `killed entity #${e.id} ("${e.name}")`;
		}
	},
	spawn: (level, type, selector, x, y, z) => {
		let entity = level.getEntities(selector);
		entity = entity == player ? entity.data() : entity,
		spawned = new Ship(type, entity);
		spawned.position.addInPlace(BABYLON.Vector3.FromArray(+x, +y, +z))
	},
	data: {
		get: (level, selector, path = '') => {
			let entityOrBody = level.getEntities(selector) ?? level.getBodies(selector);
			if(entityOrBody instanceof Array) throw new SyntaxError('passed selector can only return one entity or body');
			let data = entityOrBody.getByString(path), output = data;
			if (typeof data == 'object' || typeof data == 'function') {
					output = {};
				for (let p of Object.getOwnPropertyNames(data)) {
					output[p] = data[p];
				}
			}
			return `Data of entity #${entityOrBody.id}: ${output}`
		},
		set: (level, selector, path, value) => {
			let entityOrBody = level.getEntities(selector) ?? level.getBodies(selector);
			if(entityOrBody instanceof Array) throw new SyntaxError('passed selector can only return one entity or body');
			entityOrBody.setByString(path, eval?.(value));
		}
	},
	tp: (level, selector, x, y, z) => {
		let entities = level.getEntities(selector),
			location = new BABYLON.Vector3(+x || player.data().position.x, +y || player.data().position.y, +z || player.data().position.z);
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
	player: {
		stop: () => {
			player.stop();
		},
		reset: () => {
			player.reset();
		},
		wipe: () => {
			player.reset();
			player.wipe();
		}
	},
	playsound: (level, name, volume = settings.sfx) => {
		if (sound[name]) {
			playsound(name, volume)
		} else {
			throw new ReferenceError(`sound "${name}" does not exist`)
		}
	},
	reload: () => {
		//maybe also reload mods in the future
		game.engine.resize();
	}
};
const runCommand = (command, level) => {
	if (!saves.selected && !(saves.current instanceof Level)) throw new TypeError('Failed to run command: no level selected');
	let splitCmd = command.split(' '), hasRun = false;
	let result = (splitCmd.filter(p => p).reduce((o, p, i) => typeof o?.[p] == 'function' ? (hasRun = true, o?.[p](level, ...splitCmd.slice(i + 1))) : hasRun ? o : o?.[p] ? o?.[p] : new ReferenceError('Command does not exist'), commands) ?? '');
	return result;
};
console.log(`Blankstorm Core (${versions.get(version).text}) loaded successfully`)