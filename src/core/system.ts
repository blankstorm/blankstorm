import type { IVector2Like } from '@babylonjs/core/Maths/math.like';
import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import { filterEntities, type Entity } from 'deltablank/core/entity.js';
import { EventEmitter } from 'eventemitter3';
import {
	getRandomIntWithRecursiveProbability,
	greekLetterNames,
	pick,
	randomBoolean,
	randomFloat,
	randomInt,
	range,
	type UUID,
} from 'utilium';
import type { Item, Research } from './data';
import { Planet, planetBiomes, Star } from './entities/natural';
import { generateFleetFromPower, type ShipConfig } from './entities/ships';
import type { Shipyard } from './entities/station';
import type { BS_Level } from './level';
import config from './data/system.json' with { type: 'json' };
import { logger, randomInCircle, randomInSphere } from './utils';

export interface NaturalBodyGeneration {
	min: number;
	max: number;
	radius_min: number;
	radius_max: number;
}

export interface SystemGeneration {
	difficulty: number;
	stars: NaturalBodyGeneration & {
		color_min: number[];
		color_max: number[];
	};
	planets: NaturalBodyGeneration & {
		distance_max: number;
	};
	connections: {
		probability: number;
		distance_min: number;
		distance_max: number;
	};
}

export type SystemConnectionJSON = string | [number, number];

export interface SystemJSON {
	name: string;
	id: UUID;
	difficulty: number;
	position: IVector2Like;
	connections: SystemConnectionJSON[];
}

export interface MoveInfo<T> {
	id: UUID;
	target: T;
}

export interface ActionData {
	create_item: Item;
	create_ship: {
		ship: ShipConfig;
		shipyard?: Shipyard;
	};
	do_research: Research;
	warp: MoveInfo<System>[];
	move: MoveInfo<Vector3>[];
}

export type SystemConnection = System | Vector2;

const _copy = ['difficulty', 'name', 'id', 'position'] as const;

export class System extends EventEmitter<{
	created: [];
}> {
	public name = '';

	public difficulty = 1;
	public position: Vector2 = randomInCircle(5);
	public connections: Set<SystemConnection> = new Set();

	constructor(
		public readonly id: UUID = crypto.randomUUID(),
		public level: BS_Level
	) {
		super();
		this.level.systems.set(this.id, this);
		this.emit('created');
	}

	public entities(): IteratorObject<Entity>;
	public entities<T extends Entity = Entity>(selector: string): IteratorObject<T>;
	public *entities(selector?: string): IteratorObject<Entity> {
		for (const entity of this.level.entities) {
			if (entity.system != this) continue;
			if (!selector || entity.matches(selector)) yield entity;
		}

		const entities = [...this.level.entities].filter(e => e.system == this);
		return selector ? filterEntities(entities, selector) : new Set(entities);
	}

	public getEntityByID<N extends Entity = Entity>(id: string): N {
		for (const entity of this.entities()) {
			if (entity.id == id) return entity as N;
		}

		throw new ReferenceError('Entity does not exist');
	}

	public entity<T extends Entity = Entity>(selector: string): T {
		return this.entities<T>(selector).next().value as T;
	}

	public get selectedEntities(): IteratorObject<Entity> {
		return this.entities().filter(e => e.isSelected);
	}

	public toJSON(): SystemJSON {
		const data: SystemJSON = {
			...pick(this, _copy),
			connections: [],
		};

		for (const connection of this.connections) {
			data.connections.push(connection instanceof System ? connection.id : connection.asArray());
		}

		return data;
	}

	public fromJSON(json: SystemJSON): void {
		Object.assign(this, pick(json, _copy));

		for (const value of json.connections) {
			if (typeof value == 'string') {
				const system = this.level.systems.get(value);
				if (!system) {
					throw new ReferenceError('System does not exist');
				}
				this.connections.add(system);
				continue;
			}

			if (Array.isArray(value)) {
				this.connections.add(Vector2.FromArray(value));
				continue;
			}

			throw logger.error('Invalid connection');
		}
	}

	public static FromJSON(json: SystemJSON, level: BS_Level): System {
		const system = new System(json.id, level);
		system.fromJSON(json);
		return system;
	}

	static async Generate(name: string, options: SystemGeneration = config, level: BS_Level, system?: System) {
		system ||= new System(undefined, level);
		logger.debug(`Generating system "${name}" (${system.id})`);
		system.name = name;
		const connectionCount = getRandomIntWithRecursiveProbability(options.connections.probability);
		for (let i = 0; i < connectionCount; i++) {
			system.connections.add(randomInCircle(5));
		}
		const star = new Star(undefined, level);
		logger.debug(`	> star ${star.id}`);
		await star.load({
			name,
			position: [0, 0, 0],
			color: [0, 1, 2].map(i => Math.random() ** 3 / 2 + randomFloat(options.stars.color_min[i], options.stars.color_max[i])),
		});
		star.radius = randomInt(options.stars.radius_min, options.stars.radius_max);
		const planetCount = randomInt(options.planets.min, options.planets.max),
			names = randomBoolean() ? greekLetterNames.slice(0, planetCount) : range(1, planetCount + 1),
			planets: Planet[] = [];
		for (let i = 0; i < names.length; i++) {
			const planet = new Planet(undefined, level);
			logger.debug(`	> planet ${planet.id}`);
			planet.radius = randomInt(options.planets.radius_min, options.planets.radius_max);
			planet.fleet.addFromStrings(...generateFleetFromPower((options.difficulty * (i + 1)) ** 2));
			//planet.fleet.position = randomInSphere(randomInt(planet.radius + 5, planet.radius * 1.25), true);

			planet.name = name + ' ' + names[i];
			planet.system = system;
			planet.position = randomInSphere(randomInt((star.radius + planet.radius) * 1.5, options.planets.distance_max), true);
			planet.biome = planetBiomes[randomInt(0, 5)];

			planets[i] = planet;
		}
		return system;
	}
}
