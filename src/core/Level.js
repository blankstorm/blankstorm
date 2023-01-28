import { random, generate, greek, range } from './utils.js';
import { version, versions, config } from './meta.js';

import CelestialBody from './bodies/CelestialBody.js';
import Planet from './bodies/Planet.js';
import Star from './bodies/Star.js';

import Entity from './entities/Entity.js';
import Ship from './entities/Ship.js';
import PlayerData from './entities/Player.js';

import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { PerformanceMonitor } from '@babylonjs/core/Misc/performanceMonitor.js';

export default class Level {
	id = random.hex(16);
	name = '';
	version = version;
	date = new Date();
	difficulty = 1;
	bodies = new Map();
	entities = new Map();
	#initPromise = new Promise(() => {});
	#performanceMonitor = new PerformanceMonitor(60);

	constructor(name, doNotGenerate) {
		this.name = name;

		this.#initPromise = doNotGenerate ? Promise.resolve(this) : this.init();
	}

	get selectedEntities() {
		return [...this.entities.values()].filter(e => e.selected);
	}

	get tps() {
		return this.#performanceMonitor.averageFPS;
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
		for (let entity of this.entities.values()) {
			if (Math.abs(entity.rotation.y) > Math.PI) {
				entity.rotation.y += Math.sign(entity.rotation.y) * 2 * Math.PI;
			}

			entity.position.addInPlace(entity.velocity);
			entity.velocity.scaleInPlace(0.9);

			if (entity.hp && entity.hp <= 0) {
				entity.remove();
				//Events: trigger event, for sounds
			} else if (entity instanceof Ship) {
				for (let hardpoint of entity.hardpoints) {
					hardpoint.reload = Math.max(--hardpoint.reload, 0);

					const targets = [...this.entities.values()].filter(
						e => e.isTargetable && e.owner != entity.owner && Vector3.Distance(e.position, entity.position) < hardpoint._generic.range
					);
					const target = targets.reduce(
						(ac, cur) =>
							(ac =
								Vector3.Distance(ac?.absolutePosition ? ac.absolutePosition : Vector3.One().scale(Infinity), entity.absolutePosition) <
								Vector3.Distance(cur.absolutePosition, entity.absolutePosition)
									? ac
									: cur),
						null
					);

					if (target) {
						const targetPoints = [...target.hardpoints, target].filter(targetHardpoint => {
							const distance = Vector3.Distance(targetHardpoint.absolutePosition, hardpoint.absolutePosition);
							return distance < hardpoint._generic.range;
						});
						const targetPoint = targetPoints.reduce((current, newPoint) => {
							if(!current) return newPoint;
							const oldDistance = Vector3.Distance(current.absolutePosition, hardpoint.absolutePosition);
							const newDistance = Vector3.Distance(newPoint.absolutePosition, hardpoint.absolutePosition);
							current = oldDistance < newDistance ? current : newPoint;
						}, target);

						if (hardpoint.reload <= 0) {
							hardpoint.reload = hardpoint._generic.reload;
							hardpoint.fire(targetPoint);
						}
					}
				}
				entity.jumpCooldown = Math.max(--entity.jumpCooldown, 0);
			}
		}
	}

	serialize() {
		let data = {
			date: this.date.toJSON(),
			bodies: [],
			entities: [],
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

		for (let body of this.bodies.values()) {
			if (!(body instanceof CelestialBody)) {
				console.warn(`body #${body?.id} not serialized: not a celestial body`);
			} else {
				data.bodies.push(body.serialize());
			}
		}
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
				level,
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
					position: random.cords(random.int((star.radius + radius) * 1.5, config.planet_max_distance), true),
					radius,
					biome: ['earthlike', 'volcanic', 'jungle', 'ice', 'desert', 'moon'][random.int(0, 5)],
					fleet: generate.enemies(level.difficulty * (i + 1)),
					rewards: generate.items(1000 * i * (2 - level.difficulty)),
					level,
				});
			}
		},
	};

	static Load(levelData, engine, level) {
		if (levelData.version != version) {
			alert(`Can't load save: wrong version`);
			throw new Error(`Can't load save from data: wrong version (${levelData.version})`);
		}
	}
}
