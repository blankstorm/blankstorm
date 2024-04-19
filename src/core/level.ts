import type { IVector3Like } from '@babylonjs/core/Maths/math.like';
import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import { PerformanceMonitor } from '@babylonjs/core/Misc/performanceMonitor';
import { EventEmitter } from 'eventemitter3';
import { assignWithDefaults, pick, randomHex } from 'utilium';
import type { CelestialBodyJSON } from './entities/body';
import type { Entity, EntityJSON } from './entities/entity';
import { Planet, type PlanetData } from './entities/planet';
import { Player, type PlayerJSON } from './entities/player';
import { Ship, type ShipJSON } from './entities/ship';
import { Star, type StarJSON } from './entities/star';
import type { FleetJSON } from './fleet';
import type { GenericProjectile } from './generic/hardpoints';
import type { Item, ItemID } from './generic/items';
import { isResearchLocked, priceOfResearch, type Research, type ResearchID } from './generic/research';
import type { GenericShip, ShipType } from './generic/ships';
import type { SystemGenerationOptions } from './generic/system';
import type { VersionID } from './metadata';
import { config, version, versions } from './metadata';
import type { Berth } from './stations/berth';
import type { SystemJSON } from './system';
import { System } from './system';

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

export type ActionArgs = {
	[A in keyof ActionData]: [action: A, data: ActionData[A]];
}[keyof ActionData];

export interface LevelJSON {
	date: string;
	systems: SystemJSON[];
	difficulty: number;
	version: VersionID;
	name: string;
	id: string;
	entities: EntityJSON[];
}

export interface LevelEvents {
	body_created: [CelestialBodyJSON];
	body_removed: [CelestialBodyJSON];
	entity_added: [EntityJSON];
	entity_removed: [EntityJSON];
	entity_death: [EntityJSON];
	entity_path_start: [string, IVector3Like[]];
	entity_created: [EntityJSON];
	fleet_items_change: [FleetJSON, Record<ItemID, number>];
	player_created: [PlayerJSON];
	player_levelup: [PlayerJSON];
	player_removed: [PlayerJSON];
	player_reset: [PlayerJSON];
	projectile_fire: [string, string, GenericProjectile];
	ship_created: [ShipJSON];
	tick: [];
}

export class Level extends EventEmitter<LevelEvents> {
	public id: string = randomHex(16);
	public name: string = '';
	public version = version;
	public date = new Date();
	public difficulty = 1;
	public entities: Set<Entity> = new Set();
	public systems: Map<string, System> = new Map();
	public rootSystem: System;
	protected _performanceMonitor = new PerformanceMonitor(60);

	public constructor() {
		super();
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

	public async tryAction(
		id: string,
		...args: ActionArgs //see https://stackoverflow.com/a/76335220/21961918
	): Promise<boolean> {
		const [action, data] = args;
		const player = this.getEntityByID(id);

		if (!(player instanceof Player)) {
			return false;
		}

		switch (action) {
			case 'create_item':
				if (!data.recipe || !player.storage.hasItems(data.recipe)) {
					return false;
				}

				player.storage.removeItems(data.recipe);
				player.storage.addItems({ [data.id]: player.storage.items[data.id] + 1 });
				break;
			case 'create_ship':
				if (!player.storage.hasItems(data.ship.recipe)) {
					return false;
				}

				player.storage.removeItems(data.ship.recipe);
				const ship = new Ship(null, player.level, <ShipType>data.ship.id);
				ship.parent = ship.owner = player;
				player.fleet.add(ship);
				break;
			case 'do_research':
				if (player.research[id] >= data.max || isResearchLocked(<ResearchID>data.id, player)) {
					return false;
				}
				const neededItems = priceOfResearch(<ResearchID>data.id, player.research[data.id]);
				if (!player.storage.hasItems(neededItems)) {
					return false;
				}

				player.storage.removeItems(neededItems);
				player.research[data.id]++;
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

	public async generateSystem(name: string, position: Vector2, options: SystemGenerationOptions = config.system_generation, system?: System) {
		const difficulty = Math.max(Math.log10(Vector2.Distance(Vector2.Zero(), position)) - 1, 0.25);
		system = await System.Generate(name, { ...options, difficulty }, this, system);
		system.position = position;
		return system;
	}

	//events and ticking
	public get tps(): number {
		return this._performanceMonitor.averageFPS;
	}

	public sampleTick() {
		this._performanceMonitor.sampleFrame();
	}

	public tick() {
		this.sampleTick();
		this.emit('tick');

		for (const entity of this.entities) {
			entity.update();
		}
	}

	public toJSON(): LevelJSON {
		return {
			...pick(this, 'difficulty', 'version', 'name', 'id'),
			date: new Date().toJSON(),
			systems: [...this.systems.values()].map(system => system.toJSON()),
			entities: [...this.entities].map(entity => entity.toJSON()),
		};
	}

	public static async upgrade(data: LevelJSON) {
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

	public static From(levelData: LevelJSON, level?: Level): Level {
		if (levelData.version != version) {
			throw new Error(`Can't load level data: wrong version`);
		}

		level ??= new Level();
		assignWithDefaults(level, pick(levelData, 'difficulty', 'id', 'name', 'version'));
		level.date = new Date(levelData.date);

		for (const systemData of levelData.systems) {
			System.From(systemData, level);
		}

		/**
		 * Note: nodes is sorted to make sure celestialbodies are loaded before ships before players
		 * This prevents `level.getNodeByID(shipData) as Ship` in the Player constructor from returning null
		 * Which in turn prevents `ship.owner = ship.parent = this` from throwing an error
		 */
		const entities = levelData.entities;
		entities.sort((node1, node2) => {
			const priority = ['Star', 'Planet', 'Ship', 'Player'];
			return priority.findIndex(t => t == node1.nodeType) < priority.findIndex(t => t == node2.nodeType) ? -1 : 1;
		});
		for (const data of entities) {
			switch (data.nodeType) {
				case 'Player':
					Player.FromJSON(<PlayerJSON>data, level);
					break;
				case 'Ship':
					Ship.FromJSON(<ShipJSON>data, level);
					break;
				case 'Star':
					Star.FromJSON(<StarJSON>data, level);
					break;
				case 'Planet':
					Planet.FromJSON(<PlanetData>data, level);
					break;
				default:
			}
		}

		return level;
	}
}
