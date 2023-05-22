import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { PerformanceMonitor } from '@babylonjs/core/Misc/performanceMonitor';

import { random, greek, range } from './utils';
import { version, versions, config } from './meta';
import type { VersionID } from './meta';

import { CelestialBody } from './bodies/CelestialBody';
import type { SerializedCelestialBody } from './bodies/CelestialBody';
import { Planet } from './bodies/Planet';
import type { SerializedPlanet } from './bodies/Planet';
import { Star } from './bodies/Star';
import type { SerializedStar } from './bodies/Star';

import { Entity } from './entities/Entity';
import { SerializedEntity } from './entities/Entity';
import { Ship } from './entities/Ship';
import type { SerializedShip } from './entities/Ship';
import { Player } from './entities/Player';
import type { SerializedPlayer } from './entities/Player';
import type { Node } from './Node';

import { LevelEvent } from './events';

export interface SerializedLevel {
	date: string;
	bodies: SerializedCelestialBody[];
	entities: SerializedEntity[];
	difficulty: number;
	version: VersionID;
	name: string;
	id: string;
}

export class Level extends EventTarget {
	id = random.hex(16);
	name = '';
	version = version;
	date = new Date();
	difficulty = 1;
	nodes = new Map();
	bodies = new Map();
	entities = new Map();
	#initPromise = new Promise(() => {});
	#performanceMonitor = new PerformanceMonitor(60);

	constructor(name: string, doNotGenerate?: boolean) {
		super();
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

	async generateRegion(x: number, y: number, size: number) {
		await this.ready();
	}

	async ready(): Promise<this> {
		await Promise.allSettled([this.#initPromise]);
		return this;
	}

	getNodeByID(nodeID: string): Node {
		for (const [id, entity] of this.entities) {
			if (id == nodeID) return entity;
		}

		for (const [id, body] of this.bodies) {
			if (id == nodeID) return body;
		}

		return null;
	}

	getNodesBySelector(selector: string): Node[] {
		if (typeof selector != 'string') throw new TypeError('selector must be of type string');
		switch (selector[0]) {
			case '*':
				return [...this.nodes.values()];
			case '@':
				return [...this.entities.values()].filter(entity => entity.name == selector.substring(1));
			case '#':
				return [...this.nodes.values()].filter(node => node.id == selector.substring(1));
			case '.':
				return [...this.nodes.values()].filter(node => {
					let proto = node;
					while (proto) {
						if (proto.constructor?.name == 'Function' || proto.constructor?.name == 'Object') {
							return false;
						}

						if (proto.constructor.name.toLowerCase() == selector.substring(1)) {
							return true;
						}

						proto = Object.getPrototypeOf(proto);
					}
				});
			default:
				throw 'Invalid selector';
		}
	}

	getNodesBySelectors(...selectors: string[]): Node[] {
		return selectors.flatMap(selector => this.getNodesBySelector(selector));
	}

	getNodeBySelector(selector: string): Node {
		return this.getNodesBySelector(selector)[0];
	}

	sampleTick() {
		this.#performanceMonitor.sampleFrame();
	}

	tick() {
		this.#performanceMonitor.sampleFrame();
		const evt = new LevelEvent('level.tick', this.serialize());
		this.dispatchEvent(evt);
		for (const entity of this.entities.values()) {
			if (Math.abs(entity.rotation.y) > Math.PI) {
				entity.rotation.y += Math.sign(entity.rotation.y) * 2 * Math.PI;
			}

			entity.position.addInPlace(entity.velocity);
			entity.velocity.scaleInPlace(0.9);

			if (entity.hp && entity.hp <= 0) {
				entity.remove();
				const evt = new LevelEvent('entity.death', entity.serialize());
				this.dispatchEvent(evt);
				//Events: trigger event, for sounds
			} else if (entity instanceof Ship) {
				for (const hardpoint of entity.hardpoints) {
					hardpoint.reload = Math.max(--hardpoint.reload, 0);

					const targets = [...this.entities.values()].filter(e => {
						const distance = Vector3.Distance(e.absolutePosition, entity.absolutePosition);
						return e.isTargetable && e.owner != entity.owner && distance < hardpoint.generic.range;
					}, null);
					const target = targets.reduce((previous, current) => {
						const previousDistance = Vector3.Distance(previous?.absolutePosition ? previous.absolutePosition : Vector3.One().scale(Infinity), entity.absolutePosition);
						const currentDistance = Vector3.Distance(current.absolutePosition, entity.absolutePosition);
						return previousDistance < currentDistance ? previous : current;
					}, null);

					if (target) {
						const targetPoints = [...target.hardpoints, target].filter(targetHardpoint => {
							const distance = Vector3.Distance(targetHardpoint.absolutePosition, hardpoint.absolutePosition);
							return distance < hardpoint.generic.range;
						});
						const targetPoint = targetPoints.reduce((current, newPoint) => {
							if (!current || !newPoint) {
								return current;
							}
							const oldDistance = Vector3.Distance(current.absolutePosition, hardpoint.absolutePosition);
							const newDistance = Vector3.Distance(newPoint.absolutePosition, hardpoint.absolutePosition);
							return oldDistance < newDistance ? current : newPoint;
						}, target);

						if (hardpoint.reload <= 0) {
							hardpoint.reload = hardpoint.generic.reload;
							hardpoint.fire(targetPoint);
						}
					}
				}
				entity.jumpCooldown = Math.max(--entity.jumpCooldown, 0);
			}
		}
	}

	serialize() {
		const data = {
			date: new Date().toJSON(),
			bodies: [],
			entities: [],
			difficulty: this.difficulty,
			version: this.version,
			name: this.name,
			id: this.id,
		};

		for (const entity of this.entities.values()) {
			if (!(entity instanceof Entity)) {
				console.warn(`entity #${entity?.id} not serialized: not an entity`);
			} else {
				data.entities.push(entity.serialize());
			}
		}

		for (const body of this.bodies.values()) {
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
			const star = new Star(null, level, { radius: random.int(300, 500) });
			star.name = name;
			star.position = position;
			star.color = Color3.FromArray([
				Math.random() ** 3 / 2 + random.float(0.3, 0.4),
				Math.random() ** 3 / 2 + random.float(0.3, 0.4),
				Math.random() ** 3 / 2 + random.float(0.3, 0.4),
			]);
			const nameMode = random.bool,
				planetNum = random.int(1, Level.system.maxPlanets),
				names = random.bool ? greek.slice(0, planetNum) : range(1, planetNum + 1),
				planets = [];
			for (let i = 0; i < names.length; i++) {
				const planetName = nameMode ? names[i] + ' ' + name : name + ' ' + names[i],
					radius = random.int(25, 50);
				const planet = new Planet(null, level, {
					radius,
					fleet: Ship.GenerateFleetFromPower(level.difficulty * (i + 1)),
					rewards: {},
				});

				planet.name = random.int(0, 999) == 0 ? 'Jude' : planetName;
				planet.position = random.cords(random.int((star.radius + radius) * 1.5, config.planet_max_distance), true);
				planet.biome = ['earthlike', 'volcanic', 'jungle', 'ice', 'desert', 'moon'][random.int(0, 5)];

				planets[i] = planet;
			}
		},
	};

	static FromData(levelData: SerializedLevel, level?: Level): Level {
		if (levelData.version != version) {
			alert(`Can't load save: wrong version`);
			throw new Error(`Can't load save from data: wrong version (${levelData.version})`);
		}

		level ??= new Level(levelData.name, true);
		level.id = levelData.id;
		level.date = new Date(levelData.date);
		level.version = levelData.version;
		level.difficulty = levelData.difficulty;

		for (const data of Object.values(levelData.bodies)) {
			switch (data.node_type) {
				case 'star':
					Star.FromData(data as SerializedStar, level);
					break;
				case 'planet':
					Planet.FromData(data as SerializedPlanet, level);
					break;
				default:
			}
		}

		for (const data of Object.values(levelData.entities)) {
			switch (data.node_type) {
				case 'player':
					Player.FromData(data as SerializedPlayer, level);
					break;
				case 'ship':
					Ship.FromData(data as SerializedShip, level);
					break;
				default:
			}
		}

		return level;
	}
}