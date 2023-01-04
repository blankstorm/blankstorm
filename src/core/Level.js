import { config } from './meta.js';
import { random, generate, greek, range, filterObject } from './utils.js';
import { version, versions } from './index.js';
import CelestialBodyMaterial from './bodies/CelestialBodyMaterial.js';
import CelestialBody from './bodies/CelestialBody.js';
import Planet from './bodies/Planet.js';
import Star from './bodies/Star.js';
import Hardpoint from './Hardpoint.js';
import StationComponent from './StationComponent.js';
import Entity from './entities/Entity.js';
import Ship from './entities/Ship.js';
import PlayerData from './PlayerData.js';

import { Vector3, Matrix } from '../../node_modules/@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '../../node_modules/@babylonjs/core/Maths/math.color.js';
import { Scene } from '../../node_modules/@babylonjs/core/scene.js';
import { MeshBuilder } from '../../node_modules/@babylonjs/core/Meshes/meshBuilder.js';
import { PerformanceMonitor } from '../../node_modules/@babylonjs/core/Misc/performanceMonitor.js';
import { GlowLayer } from '../../node_modules/@babylonjs/core/Layers/glowLayer.js';
import { HighlightLayer } from '../../node_modules/@babylonjs/core/Layers/highlightLayer.js';
import { ReflectionProbe } from '../../node_modules/@babylonjs/core/Probes/reflectionProbe.js';
import { StandardMaterial } from '../../node_modules/@babylonjs/core/Materials/standardMaterial.js';
import { CubeTexture } from '../../node_modules/@babylonjs/core/Materials/Textures/cubeTexture.js';
import { SceneLoader } from '../../node_modules/@babylonjs/core/Loading/sceneLoader.js';

const Level = class extends Scene {
	id = random.hex(16);
	name = '';
	version = version;
	date = new Date();
	difficulty = 1;
	clearColor = new Color3(0.8, 0.75, 0.85);
	genericMeshes = {};
	bodies = new Map();
	entities = new Map();
	playerData = new Map();
	#initPromise = new Promise(() => {});
	loadedGenericMeshes = new Promise(() => {});
	#performanceMonitor = new PerformanceMonitor(60);
	constructor(name, engine, doNotGenerate) {
		super(engine);
		Object.assign(this, {
			skybox: MeshBuilder.CreateBox('skybox', { size: Level.system.size * 2 }, this),
			gl: Object.assign(new GlowLayer('glowLayer', this), { intensity: 0.9 }),
			hl: new HighlightLayer('highlight', this),
			xzPlane: MeshBuilder.CreatePlane('xzPlane', { size: Level.system.size * 2 }, this),
			probe: new ReflectionProbe('probe', 256, this),
		});
		this.xzPlane.rotation.x = Math.PI / 2;
		this.xzPlane.setEnabled(false);
		this.skybox.infiniteDistance = true;
		this.skybox.isPickable = false;
		this.skybox.material = Object.assign(new StandardMaterial('skybox.mat', this), {
			backFaceCulling: false,
			disableLighting: true,
			reflectionTexture: CubeTexture.CreateFromImages(Array(6).fill('images/skybox.jpg'), this),
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
					body.material.setMatrix('rotation', Matrix.RotationY(body.matrixAngle));
					body.matrixAngle -= 0.0004 * ratio;
					body.material.setVector3(
						'options',
						new Vector3(body.material.generationOptions.clouds, body.material.generationOptions.groundAlbedo, body.material.generationOptions.cloudAlbedo)
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
				let container = (this.genericMeshes[id] = await SceneLoader.LoadAssetContainerAsync('', generic.model, this));
				Object.assign(container.meshes[0], {
					rotationQuaternion: null,
					material: Object.assign(container.materials[0], {
						realTimeFiltering: true,
						realTimeFilteringQuality: [2, 8, 32][+config.render_quality],
						reflectionTexture: this.probe.cubeTexture,
					}),
					position: Vector3.Zero(),
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
			instance = MeshBuilder.CreateBox('error_mesh', { size: 1 }, this);
			instance.material = new StandardMaterial('error_material', this);
			instance.material.emissiveColor = Color3.Gray();
			throw 'Origin mesh does not exist';
		}

		return instance;
	}
	async init() {
		return await Level.generate.system('Crash Site', Vector3.Zero(), this);
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
				let targets = [...this.entities.values()].filter(e => e.owner != entity.owner && Vector3.Distance(e.position, entity.position) < entityRange);
				let target = targets.reduce(
					(ac, cur) =>
						(ac =
							Vector3.Distance(ac?.getAbsolutePosition ? ac.getAbsolutePosition() : Vector3.One().scale(Infinity), entity.getAbsolutePosition()) <
							Vector3.Distance(cur.getAbsolutePosition(), entity.getAbsolutePosition())
								? ac
								: cur),
					null
				);
				if (target) {
					for (let hp of entity.hardpoints) {
						let targetPoints = [...target.hardpoints, target].filter(e => Vector3.Distance(e.getAbsolutePosition(), hp.getAbsolutePosition()) < hp._generic.range),
							targetPoint = targetPoints.reduce(
								(ac, cur) =>
									(ac =
										Vector3.Distance(ac.getAbsolutePosition(), hp.getAbsolutePosition()) < Vector3.Distance(cur.getAbsolutePosition(), hp.getAbsolutePosition())
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
		return pickInfo.pickedPoint || Vector3.Zero();
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
					...filterObject(body, 'name', 'id', 'owner'),
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
				color: new Color3(
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
			...filterObject(levelData, 'id', 'name', 'versions', 'difficulty'),
		});

		for (let [id, data] of levelData.playerData) {
			level.playerData.set(
				id,
				new PlayerData({
					position: Vector3.FromArray(data.position),
					rotation: Vector3.FromArray(data.rotation),
					id,
					...filterObject(data, 'xp', 'xpPoints', 'tech'),
				})
			);
		}

		for (let id in levelData.bodies) {
			let bodyData = levelData.bodies[id];
			switch (bodyData.type) {
				case 'star':
					new Star({
						position: Vector3.FromArray(bodyData.position),
						color: Color3.FromArray(bodyData.color),
						scene: level,
						...filterObject(bodyData, 'name', 'radius', 'id'),
					});
					break;
				case 'planet':
					new Planet({
						position: Vector3.FromArray(bodyData.position),
						scene: level,
						...filterObject(bodyData, 'name', 'radius', 'id', 'biome', 'owner', 'rewards'),
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

export default Level;
