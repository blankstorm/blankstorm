import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import EventEmitter from 'eventemitter3';
import { getRandomIntWithRecursiveProbability, greekLetterNames, randomBoolean, randomFloat, randomHex, randomInt, range } from 'utilium';
import { filterEntities, type Entity } from './entities/entity';
import { Planet } from './entities/planet';
import { generateFleetFromPower } from './entities/ship';
import { Star } from './entities/star';
import type { Item } from './generic/items';
import { planetBiomes } from './generic/planets';
import type { Research } from './generic/research';
import type { GenericShip } from './generic/ships';
import type { SystemGenerationOptions } from './generic/system';
import type { Level } from './level';
import { config } from './metadata';
import type { Berth } from './entities/station/berth';
import { logger, randomCords } from './utils';

export type SystemConnectionJSON = { type: 'system'; value: string } | { type: 'position'; value: number[] } | { type: string; value };

export interface SystemJSON {
	name: string;
	id: string;
	difficulty: number;
	position: number[];
	connections: SystemConnectionJSON[];
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
	created: [];
}> {
	public name = '';

	public difficulty = 1;
	public position: Vector2;
	public connections: SystemConnection[] = [];

	constructor(
		public id: string = randomHex(32),
		public level: Level
	) {
		super();
		this.id ||= randomHex(32);
		this.level.systems.set(this.id, this);
		this.emit('created');
	}

	public entities(): Set<Entity>;
	public entities<T extends Entity = Entity>(selector: string): Set<T>;
	public entities(selector?: string): Set<Entity> {
		const entities = [...this.level.entities].filter(e => e.system == this);
		return selector ? filterEntities(entities, selector) : new Set(entities);
	}

	public getEntityByID<N extends Entity = Entity>(id: string): N {
		for (const entity of this.entities()) {
			if (entity.id == id) return <N>entity;
		}

		throw new ReferenceError('Entity does not exist');
	}

	public entity<T extends Entity = Entity>(selector: string): T {
		return this.entities<T>(selector).values().next().value;
	}

	public get selectedEntities(): Entity[] {
		return [...this.entities()].filter(e => e.isSelected);
	}

	public toJSON(): SystemJSON {
		const data: SystemJSON = {
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

	public fromJSON(json: SystemJSON): void {
		this.name = json.name;
		this.difficulty = json.difficulty;
		this.position = Vector2.FromArray(json.position);

		for (const { type, value } of json.connections) {
			switch (type) {
				case 'system':
					if (!this.level.systems.has(value)) {
						throw new ReferenceError('System does not exist');
					}
					this.connections.push(this.level.systems.get(value)!);
					break;
				case 'position':
					this.connections.push(Vector2.FromArray(value));
					break;
				default:
					this.connections.push(value);
			}
		}
	}

	public static FromJSON(json: SystemJSON, level: Level): System {
		const system = new System(json.id, level);
		system.fromJSON(json);
		return system;
	}

	static async Generate(name: string, options: SystemGenerationOptions = config.system_generation, level: Level, system?: System) {
		system ||= new System(undefined, level);
		logger.debug(`Generating system "${name}" (${system.id})`);
		system.name = name;
		const connectionCount = getRandomIntWithRecursiveProbability(options.connections.probability);
		system.connections = new Array(connectionCount);
		const star = new Star(undefined, level);
		logger.debug(`	> star ${star.id}`);
		star.fromJSON({
			name,
			system: system.id,
			radius: randomInt(options.stars.radius_min, options.stars.radius_max),
			position: [0, 0, 0],
			color: [0, 1, 2].map(i => Math.random() ** 3 / 2 + randomFloat(options.stars.color_min[i], options.stars.color_max[i])),
		});
		const usePrefix = randomBoolean(),
			planetCount = randomInt(options.planets.min, options.planets.max),
			names = randomBoolean() ? greekLetterNames.slice(0, planetCount) : range(1, planetCount + 1),
			planets: Planet[] = [];
		for (let i = 0; i < names.length; i++) {
			const planet = new Planet(undefined, level);
			logger.debug(`	> planet ${planet.id}`);
			planet.radius = randomInt(options.planets.radius_min, options.planets.radius_max);
			planet.fleet.addFromStrings(...generateFleetFromPower((options.difficulty * (i + 1)) ** 2));
			planet.fleet.position = randomCords(randomInt(planet.radius + 5, planet.radius * 1.25), true);

			planet.name = usePrefix ? names[i] + ' ' + name : name + ' ' + names[i];
			planet.system = system;
			planet.position = randomCords(randomInt((star.radius + planet.radius) * 1.5, options.planets.distance_max), true);
			planet.biome = planetBiomes[randomInt(0, 5)];

			planets[i] = planet;
		}
		return system;
	}
}
