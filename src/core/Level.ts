import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { PerformanceMonitor } from '@babylonjs/core/Misc/performanceMonitor';

import { random, greek, range } from './utils';
import { version, versions, config } from './meta';
import type { VersionID } from './meta';

import { Planet } from './nodes/Planet';
import type { SerializedPlanet } from './nodes/Planet';
import { Star } from './nodes/Star';
import type { SerializedStar } from './nodes/Star';
import { Ship } from './nodes/Ship';
import type { SerializedShip } from './nodes/Ship';
import { Player } from './nodes/Player';
import type { SerializedPlayer } from './nodes/Player';
import type { Node, SerializedNode } from './nodes/Node';
import { LevelEvent } from './events';
import type { EventData } from './events';
import type { Item } from './generic/items';
import type { GenericShip, ShipType } from './generic/ships';
import { isResearchLocked, priceOfResearch } from './generic/research';
import type { Research, ResearchID } from './generic/research';
import type { Berth } from './stations/Berth';
import { systemNames } from './generic/level';
import { planetBiomes } from './generic/planets';

export interface SerializedLevel {
	date: string;
	nodes: SerializedNode[];
	difficulty: number;
	version: VersionID;
	name: string;
	id: string;
}

interface PlayerActionDataTypes {
	create_item: Item;
	create_ship: {
		ship: GenericShip;
		berth?: Berth;
	};
	do_research: Research;
}

export interface CelestialBodyGenerationOptions {
	min: number;
	max: number;
	radius_min: number;
	radius_max: number;
}

export interface StarGenerationOptions extends CelestialBodyGenerationOptions {
	color_min: number[];
	color_max: number[];
}

export interface PlanetGenerationOptions extends CelestialBodyGenerationOptions {
	distance_max: number;
}

export interface SystemGenerationOptions {
	stars: StarGenerationOptions;
	planets: PlanetGenerationOptions;
}

export class Level extends EventTarget {
	id = random.hex(16);
	name = '';
	version = version;
	date = new Date();
	difficulty = 1;
	nodes: Map<string, Node> = new Map();
	#initPromise: Promise<Level>;
	#performanceMonitor = new PerformanceMonitor(60);

	constructor(name: string) {
		super();
		this.name = name;

		this.#initPromise = this.init();
	}

	async init(): Promise<Level> {
		return this;
	}

	async ready(): Promise<this> {
		await Promise.allSettled([this.#initPromise]);
		return this;
	}

	tryPlayerAction(
		id: string,
		...args: {
			[A in keyof PlayerActionDataTypes]: [action: A, data: PlayerActionDataTypes[A]];
		}[keyof PlayerActionDataTypes] //see https://stackoverflow.com/a/76335220/21961918
	): boolean {
		const [action, data] = args;
		const player = [...this.nodes.values()].find(entity => entity.nodeType == 'player' && entity.id == id);

		if (!(player instanceof Player)) {
			return false;
		}

		switch (action) {
			case 'create_item':
				if (data.recipe && player.hasItems(data.recipe)) {
					player.removeItems(data.recipe);
					player.addItems({ [data.id]: player.items[data.id] + 1 });
				}
				break;
			case 'create_ship':
				if (player.hasItems(data.ship.recipe)) {
					player.removeItems(data.ship.recipe);
					const ship = new Ship(null, player.level, { type: data.ship.id as ShipType, power: player.power });
					ship.parent = ship.owner = player;
					player.fleet.push(ship);
				}
				break;
			case 'do_research':
				const neededItems = priceOfResearch(data.id as ResearchID, player.research[data.id]);
				if (player.hasItems(neededItems) && player.research[id] < data.max && !isResearchLocked(data.id as ResearchID, player) && player.xpPoints >= 1) {
					player.removeItems(neededItems);
					player.research[data.id]++;
					player.xpPoints--;
				}
				break;
			default: //action does not exist
				return false;
		}
	}

	//selectors
	get selected() {
		return [...this.nodes.values()].filter(e => e.selected);
	}

	getNodeByID(nodeID: string): Node {
		for (const [id, body] of this.nodes) {
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
				return [...this.nodes.values()].filter(entity => entity.name == selector.substring(1));
			case '#':
				return [...this.nodes.values()].filter(node => node.id == selector.substring(1));
			case '.':
				return [...this.nodes.values()].filter(node => {
					let proto = node;
					while (proto) {
						if (proto.constructor?.name == 'Function' || proto.constructor?.name == 'Object') {
							return false;
						}

						if (new RegExp(proto.constructor.name, 'i').test(selector.substring(1))) {
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

	// generation
	async generateRegion(regionPosition: Vector2) {
		await this.ready();
		const name = systemNames[random.int(0, systemNames.length - 1)],
			systemPosition = random.cords(config.region_size / 2, true).addInPlaceFromFloats(regionPosition.x, 0, regionPosition.y);
		await this.generateSystem(name, systemPosition);
	}

	async generateSystem(name: string, position: Vector3, options: SystemGenerationOptions = config.system_generation) {
		const localDifficulty = Math.max(Math.log10(Vector3.Distance(Vector3.Zero(), position)) - 1, 0.25);
		const star = new Star(null, this, { radius: random.int(options.stars.radius_min, options.stars.radius_max) });
		star.name = name;
		star.position = position;
		star.color = Color3.FromArray([
			Math.random() ** 3 / 2 + random.float(options.stars.color_min[0], options.stars.color_max[0]),
			Math.random() ** 3 / 2 + random.float(options.stars.color_min[1], options.stars.color_max[1]),
			Math.random() ** 3 / 2 + random.float(options.stars.color_min[2], options.stars.color_max[2]),
		]);
		const usePrefix = random.bool(),
			planetCount = random.int(options.planets.min, options.planets.max),
			names = random.bool() ? greek.slice(0, planetCount) : range(1, planetCount + 1),
			planets = [];
		for (let i = 0; i < names.length; i++) {
			const radius = random.int(options.planets.radius_min, options.planets.radius_max);
			const planet = new Planet(null, this, {
				radius,
				fleet: Ship.GenerateFleetFromPower(this.difficulty * localDifficulty * (i + 1)),
				rewards: {},
			});

			planet.name = random.int(0, 999) == 0 ? 'Jude' : usePrefix ? names[i] + ' ' + name : name + ' ' + names[i];
			planet.position = random.cords(random.int((star.radius + radius) * 1.5, options.planets.distance_max), true).add(position);
			planet.biome = planetBiomes[random.int(0, 5)];

			planets[i] = planet;
		}
	}

	//events and ticking
	get tps(): number {
		return this.#performanceMonitor.averageFPS;
	}

	emit(type: string, emitter: SerializedLevel | SerializedNode, data?: EventData): boolean {
		const event = new LevelEvent(type, emitter, data, this);
		return super.dispatchEvent(event);
	}

	sampleTick() {
		this.#performanceMonitor.sampleFrame();
	}

	tick() {
		this.sampleTick();
		this.emit('level.tick', this.toJSON());
		for (const node of this.nodes.values()) {
			if (Math.abs(node.rotation.y) > Math.PI) {
				node.rotation.y += Math.sign(node.rotation.y) * 2 * Math.PI;
			}

			node.position.addInPlace(node.velocity);
			node.velocity.scaleInPlace(0.9);

			if (node instanceof Ship) {
				if (node.hp <= 0) {
					node.remove();
					this.emit('entity.death', node.toJSON());
					continue;
				}
				for (const hardpoint of node.hardpoints) {
					hardpoint.reload = Math.max(--hardpoint.reload, 0);

					const targets = [...this.nodes.values()].filter(e => {
						const distance = Vector3.Distance(e.absolutePosition, node.absolutePosition);
						return e.isTargetable && e.owner != node.owner && distance < hardpoint.generic.range;
					}, null);
					const target = targets.reduce((previous, current) => {
						const previousDistance = Vector3.Distance(previous?.absolutePosition ? previous.absolutePosition : Vector3.One().scale(Infinity), node.absolutePosition);
						const currentDistance = Vector3.Distance(current.absolutePosition, node.absolutePosition);
						return previousDistance < currentDistance ? previous : current;
					}, null);

					/**
					 * @todo Add support for targeting stations
					 */
					if (target instanceof Ship) {
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
				node.jumpCooldown = Math.max(--node.jumpCooldown, 0);
			}
		}

		for (const berth of [...this.nodes.values()].filter((body: Node) => body.nodeType == 'berth') as Berth[]) {
			berth.productionTime = Math.max(berth.productionTime - 1, 0);
			if (berth.productionTime == 0 && berth.productionID) {
				const ship = new Ship(null, this, { type: berth.productionID });
				ship.position = berth.absolutePosition;
				ship.owner = berth.station.owner;
				berth.productionID = null;
				this.emit('ship.created', berth.toJSON(), { ship });
			}
		}
	}

	toJSON(): SerializedLevel {
		const data = {
			date: new Date().toJSON(),
			nodes: [],
			difficulty: this.difficulty,
			version: this.version,
			name: this.name,
			id: this.id,
		};

		for (const node of this.nodes.values()) {
			if (!node.nodeTypes.includes('entity') && !node.nodeTypes.includes('celestialbody')) {
				continue;
			}

			data.nodes.push(node.toJSON());
		}

		return data;
	}

	static async upgrade(data: SerializedLevel) {
		switch (data.version) {
			case 'infdev_1':
			case 'infdev_2':
			case 'infdev_3':
			case 'infdev_4':
			case 'infdev_5':
			case 'infdev_6':
			case 'infdev_7':
			case 'infdev_8':
			case 'infdev_9':
			case 'infdev_10':
			case 'infdev_11':
			case 'alpha_1.0.0':
			case 'alpha_1.1.0':
			case 'alpha_1.2.0':
			case 'alpha_1.2.1':
			case 'alpha_1.3.0':
			case 'alpha_1.3.1':
			case 'alpha_1.4.0':
			case 'alpha_1.4.1':
			case 'alpha_1.4.2':
				throw `Upgrading from ${versions.get(data.version).text} is not supported`;
		}
		return data;
	}

	static FromJSON(levelData: SerializedLevel, level?: Level): Level {
		if (levelData.version != version) {
			throw new Error(`Can't load level data: wrong version`);
		}

		level ??= new Level(levelData.name);
		level.id = levelData.id;
		level.date = new Date(levelData.date);
		level.version = levelData.version;
		level.difficulty = levelData.difficulty;

		/**
		 * Note: nodes is sorted to make sure all ships are loaded first.
		 * This prevents `level.getNodeByID(shipData) as Ship` in the Player constructor from returning null
		 * Which in turn prevents `ship.owner = ship.parent = this` from throwing an error
		 */
		const nodes = Object.values(levelData.nodes);
		nodes.sort(e => (e.nodeType == 'player' ? 1 : -1));
		for (const data of nodes) {
			switch (data.nodeType) {
				case 'player':
					Player.FromJSON(data as SerializedPlayer, level);
					break;
				case 'ship':
					Ship.FromJSON(data as SerializedShip, level);
					break;
				case 'star':
					Star.FromJSON(data as SerializedStar, level);
					break;
				case 'planet':
					Planet.FromJSON(data as SerializedPlanet, level);
					break;
				default:
			}
		}

		return level;
	}
}
