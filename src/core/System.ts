import EventEmitter from 'eventemitter3';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { PerformanceMonitor } from '@babylonjs/core/Misc/performanceMonitor';
import { Planet, type SerializedPlanet } from './entities/Planet';
import type { Entity } from './entities/Entity.glslx';
import { Ship, type SerializedShip } from './entities/Ship';
import { Star, type SerializedStar } from './entities/Star';
import { Player, type SerializedPlayer } from './entities/Player';
import { planetBiomes } from './generic/planets';
import type { Item } from './generic/items';
import type { GenericShip, ShipType } from './generic/ships';
import type { Researchable, ResearchID } from './generic/research';
import { priceOfResearch, isResearchLocked } from './generic/research';
import type { SystemGenerationOptions } from './generic/system';
import { Berth } from './entities/Berth';
import type { Level } from './Level';
import { config } from './metadata';
import { getRandomIntWithRecursiveProbability, greek, randomBoolean, randomCords, randomFloat, randomHex, randomInt, range } from './utils';

export type SerializedSystemConnection = { type: 'system'; value: string } | { type: 'position'; value: number[] } | { type: string; value };

export interface SerializedSystem {
	nodes: SerializedNode[];
	name: string;
	id: string;
	difficulty: number;
	position: number[];
	connections: SerializedSystemConnection[];
}

export interface MoveInfo<T> {
	id: string;
	target: T;
}

export interface ActionData {
	create_item: Item;
	create_ship: {
		ship: GenericShip;
		berth?: Berth;
	};
	do_research: Researchable;
	warp: MoveInfo<System>[];
	move: MoveInfo<Vector3>[];
}

export type SystemConnection = System | Vector2;

export class System extends EventEmitter {
	public name = '';
	public difficulty = 1;
	protected _performanceMonitor = new PerformanceMonitor(60);
	public position: Vector2;
	public connections: SystemConnection[] = [];

	public get entities(): Set<Entity> {
		
	}

	constructor(public id: string, public level: Level) {
		super();
		this.id ||= randomHex(32);
		this.level.systems.set(this.id, this);
	}

	async tryAction(
		id: string,
		...args: {
			[A in keyof ActionData]: [action: A, data: ActionData[A]];
		}[keyof ActionData] //see https://stackoverflow.com/a/76335220/21961918
	): Promise<boolean> {
		const [action, data] = args;
		const player = this.entities.get(id);

		if (!(player instanceof Player)) {
			return false;
		}

		switch (action) {
			case 'create_item':
				if (!data.recipe || !player.hasItems(data.recipe)) {
					return false;
				}

				player.removeItems(data.recipe);
				player.addItems({ [data.id]: player.items[data.id] + 1 });
				break;
			case 'create_ship':
				if (!player.hasItems(data.ship.recipe)) {
					return false;
				}

				player.removeItems(data.ship.recipe);
				const ship = new Ship(null, player.level, { type: <ShipType>data.ship.id, power: player.power });
				ship.parent = ship.owner = player;
				player.fleet.push(ship);
				break;
			case 'do_research':
				if (player.research[id] >= data.max || isResearchLocked(<ResearchID>data.id, player) || player.xpPoints < 1) {
					return false;
				}
				const neededItems = priceOfResearch(<ResearchID>data.id, player.research[data.id]);
				if (!player.hasItems(neededItems)) {
					return false;
				}

				player.removeItems(neededItems);
				player.research[data.id]++;
				player.xpPoints--;
				break;
			case 'warp':
				for (const { id, target } of data) {
					this.getEntityByID<Ship>(id).jumpTo(target);
				}
				break;
			case 'move':
				for (const { id, target } of data) {
					this.getEntityByID<Entity>(id).moveTo(target);
				}
				break;
			default: //action does not exist
				return false;
		}
		return true;
	}

	//selectors
	get selected() {
		return [...this.nodes.values()].filter(e => e.selected);
	}

	//events and ticking
	get tps(): number {
		return this._performanceMonitor.averageFPS;
	}

	sampleTick() {
		this._performanceMonitor.sampleFrame();
	}

	tick() {
		this.sampleTick();
		this.emit('system.tick', this.toJSON());
		
	}

	toJSON(): SerializedSystem {
		const data: SerializedSystem = {
			nodes: [],
			difficulty: this.difficulty,
			name: this.name,
			id: this.id,
			position: this.position.asArray(),
			connections: [],
		};

		for (const connection of this.connections) {
			if (connection instanceof System) {
				data.connections.push({ type: 'system', value: connection.id });
				continue;
			}

			if (connection instanceof Vector2) {
				data.connections.push({ type: 'position', value: connection.asArray() });
				continue;
			}

			data.connections.push({ type: 'other', value: connection });
		}

		for (const node of this.entities.values()) {
			if (!node.nodeTypes.includes('Entity') && !node.nodeTypes.includes('CelestialBody')) {
				continue;
			}

			data.nodes.push(node.toJSON());
		}

		return data;
	}

	static FromJSON(systemData: SerializedSystem, level: Level, system?: System): System {
		system ||= new System(systemData.id, level);
		system.name = systemData.name;
		system.difficulty = systemData.difficulty;
		system.position = Vector2.FromArray(systemData.position);

		for (const connection of systemData.connections) {
			switch (connection.type) {
				case 'system':
					system.connections.push(level.systems.get(connection.value));
					break;
				case 'position':
					system.connections.push(Vector2.FromArray(connection.value));
					break;
				default:
					system.connections.push(connection.value);
			}
		}

		/**
		 * Note: nodes is sorted to make sure celestialbodies are loaded before ships before players
		 * This prevents `level.getEntityByID(shipData) as Ship` in the Player constructor from returning null
		 * Which in turn prevents `ship.owner = ship.parent = this` from throwing an error
		 */
		const nodes = systemData.nodes;
		nodes.sort((node1, node2) => {
			const priority = ['Star', 'Planet', 'Ship', 'Player'];
			return priority.findIndex(t => t == node1.nodeType) < priority.findIndex(t => t == node2.nodeType) ? -1 : 1;
		});
		for (const data of nodes) {
			switch (data.nodeType) {
				case 'Player':
					Player.FromJSON(data as SerializedPlayer, system);
					break;
				case 'Ship':
					Ship.FromJSON(data as SerializedShip, system);
					break;
				case 'Star':
					Star.FromJSON(data as SerializedStar, system);
					break;
				case 'Planet':
					Planet.FromJSON(data as SerializedPlanet, system);
					break;
				default:
			}
		}

		return system;
	}

	static async Generate(name: string, options: SystemGenerationOptions = config.system_generation, level: Level, system?: System) {
		system ||= new System(null, level);
		system.name = name;
		const connectionCount = getRandomIntWithRecursiveProbability(options.connections.probability);
		system.connections = new Array(connectionCount);
		const star = new Star(null, system, { radius: randomInt(options.stars.radius_min, options.stars.radius_max) });
		star.name = name;
		star.position = Vector3.Zero();
		star.color = Color3.FromArray([
			Math.random() ** 3 / 2 + randomFloat(options.stars.color_min[0], options.stars.color_max[0]),
			Math.random() ** 3 / 2 + randomFloat(options.stars.color_min[1], options.stars.color_max[1]),
			Math.random() ** 3 / 2 + randomFloat(options.stars.color_min[2], options.stars.color_max[2]),
		]);
		const usePrefix = randomBoolean(),
			planetCount = randomInt(options.planets.min, options.planets.max),
			names = randomBoolean() ? greek.slice(0, planetCount) : range(1, planetCount + 1),
			planets = [];
		for (let i = 0; i < names.length; i++) {
			const radius = randomInt(options.planets.radius_min, options.planets.radius_max);
			const planet = new Planet(null, system, {
				radius,
				fleet: Ship.GenerateFleetFromPower((options.difficulty * (i + 1)) ** 2),
				rewards: {},
			});

			planet.name = randomInt(0, 999) == 0 ? 'Jude' : usePrefix ? names[i] + ' ' + name : name + ' ' + names[i];
			planet.position = randomCords(randomInt((star.radius + radius) * 1.5, options.planets.distance_max), true);
			planet.biome = planetBiomes[randomInt(0, 5)];

			planets[i] = planet;
		}
		return system;
	}
}
