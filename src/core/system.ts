import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import EventEmitter from 'eventemitter3';
import type { Level } from './level';
import { type Entity } from './entities/entity';
import { Planet } from './entities/planet';
import { Ship } from './entities/ship';
import { Star } from './entities/star';
import type { Item } from './generic/items';
import { planetBiomes } from './generic/planets';
import type { Research } from './generic/research';
import type { GenericShip } from './generic/ships';
import type { SystemGenerationOptions } from './generic/system';
import { config } from './metadata';
import { Berth } from './stations/berth';
import { getRandomIntWithRecursiveProbability, greek, randomBoolean, randomCords, randomFloat, randomHex, randomInt, range } from './utils';

export type SerializedSystemConnection = { type: 'system'; value: string } | { type: 'position'; value: number[] } | { type: string; value };

export interface SerializedSystem {
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
	do_research: Research;
	warp: MoveInfo<System>[];
	move: MoveInfo<Vector3>[];
}

export type SystemConnection = System | Vector2;

export class System extends EventEmitter<{
	null;
}> {
	public name = '';

	public difficulty = 1;
	public position: Vector2;
	public connections: SystemConnection[] = [];

	constructor(
		public id: string,
		public level: Level
	) {
		super();
		this.id ||= randomHex(32);
		this.level.systems.set(this.id, this);
	}

	public get entities(): Set<Entity> {
		const entities = [...this.level.entities].filter(e => e.system == this);
		return new Set(entities);
	}

	public getEntityByID<N extends Entity = Entity>(id: string): N {
		for (const entity of this.entities) {
			if (entity.id == id) return <N>entity;
		}

		return null;
	}

	protected _selectEntities(selector: string): Entity[] {
		if (typeof selector != 'string') throw new TypeError('selector must be of type string');
		switch (selector[0]) {
			case '*':
				return [...this.entities];
			case '@':
				return [...this.entities].filter(entity => entity.name == selector.substring(1));
			case '#':
				return [...this.entities].filter(entity => entity.id == selector.substring(1));
			case '.':
				return [...this.entities].filter(entity => {
					for (const type of entity.nodeTypes) {
						if (type.toLowerCase().includes(selector.substring(1).toLowerCase())) {
							return true;
						}
					}
					return false;
				});
			default:
				throw 'Invalid selector';
		}
	}

	public selectEntities(...selectors: string[]): Entity[] {
		return selectors.flatMap(selector => this._selectEntities(selector));
	}

	public selectEntity<T extends Entity = Entity>(selector: string): T {
		return <T>this._selectEntities(selector)[0];
	}

	public get selected() {
		return [...this.entities].filter(e => e.selected);
	}

	toJSON(): SerializedSystem {
		const data: SerializedSystem = {
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

		return system;
	}

	static async Generate(name: string, options: SystemGenerationOptions = config.system_generation, level: Level, system?: System) {
		system ||= new System(null, level);
		system.name = name;
		const connectionCount = getRandomIntWithRecursiveProbability(options.connections.probability);
		system.connections = new Array(connectionCount);
		const star = new Star(null, level, { radius: randomInt(options.stars.radius_min, options.stars.radius_max) });
		star.name = name;
		star.system = system;
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
			const planet = new Planet(null, level, {
				radius,
				fleet: { ships: Ship.GenerateFleetFromPower((options.difficulty * (i + 1)) ** 2) },
				rewards: {},
			});

			planet.name = usePrefix ? names[i] + ' ' + name : name + ' ' + names[i];
			planet.system = system;
			planet.position = randomCords(randomInt((star.radius + radius) * 1.5, options.planets.distance_max), true);
			planet.biome = planetBiomes[randomInt(0, 5)];

			planets[i] = planet;
		}
		return system;
	}
}
