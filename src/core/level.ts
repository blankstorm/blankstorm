import type { IVector3Like } from '@babylonjs/core/Maths/math.like';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PerformanceMonitor } from '@babylonjs/core/Misc/performanceMonitor';
import { EventEmitter } from 'eventemitter3';
import { assignWithDefaults, pick, randomHex, type Entries, type Expand } from 'utilium';
import type { Component } from './components/component';
import { Fleet, type FleetJSON } from './components/fleet';
import { filterEntities, resetTickInfo, type Entity, type EntityJSON } from './entities/entity';
import { Planet } from './entities/planet';
import { Player, type PlayerJSON } from './entities/player';
import { Ship } from './entities/ship';
import { Star } from './entities/star';
import type { Shipyard } from './entities/station/shipyard';
import { Waypoint } from './entities/waypoint';
import type { Item, ItemID } from './generic/items';
import { isResearchLocked, priceOfResearch, type Research } from './generic/research';
import type { GenericShip } from './generic/ships';
import type { SystemGenerationOptions } from './generic/system';
import type { VersionID } from './metadata';
import { config, version, versions } from './metadata';
import type { SystemJSON } from './system';
import { System } from './system';
import { logger } from './utils';

export interface MoveInfo<T> {
	id: string;
	target: T;
}

export interface LevelJSON {
	date: string;
	systems: SystemJSON[];
	difficulty: number;
	version: VersionID;
	name: string;
	id: string;
	entities: EntityJSON[];
}

const copy = ['difficulty', 'version', 'name', 'id'] as const satisfies ReadonlyArray<keyof Level>;

export interface LevelEvents {
	entity_added: [EntityJSON];
	entity_removed: [EntityJSON];
	entity_death: [EntityJSON];
	entity_path_start: [string, IVector3Like[]];
	fleet_items_change: [FleetJSON, Record<ItemID, number>];
	player_levelup: [PlayerJSON];
	player_reset: [PlayerJSON];
	update: [];
}

export const levelEventNames = [
	'entity_added',
	'entity_removed',
	'entity_death',
	'entity_path_start',
	'fleet_items_change',
	'player_levelup',
	'player_reset',
	'update',
] satisfies (keyof LevelEvents)[];

type _ActionsData = {
	create_item: Item;
	create_ship: { ship: GenericShip; shipyard?: Shipyard };
	research: Research;
	warp: MoveInfo<System>[];
	move: MoveInfo<IVector3Like>[];
};

export type ActionType = Expand<keyof _ActionsData>;

export type ActionData<T extends ActionType> = _ActionsData[T];

export class Level extends EventEmitter<LevelEvents> implements Component<LevelJSON> {
	public id: string = randomHex(16);
	public name: string = '';
	public version = version;
	public date = new Date();
	public difficulty = 1;
	public entities: Set<Entity> = new Set();
	public systems: Map<string, System> = new Map();
	public rootSystem!: System;
	protected _performanceMonitor = new PerformanceMonitor(60);

	public ready(): Promise<this> {
		return Promise.resolve(this);
	}

	public getEntityByID<N extends Entity = Entity>(id: string): N {
		for (const entity of this.entities) {
			if (entity.id == id) return entity as N;
		}

		throw new ReferenceError('Entity does not exist');
	}

	public selectEntities(selector: string): Set<Entity> {
		return filterEntities(this.entities, selector);
	}

	public entity<T extends Entity = Entity>(selector: string): T {
		return this.selectEntities(selector).values().next().value as T;
	}

	public tryAction<T extends ActionType>(id: string, action: T, data: ActionData<T>): boolean {
		const player = this.getEntityByID(id);

		if (!(player instanceof Player)) {
			return false;
		}

		const [_action, _data] = [action, data] as Entries<_ActionsData>[number];

		switch (_action) {
			case 'create_item': {
				if (!_data.recipe || !player.storage.hasItems(_data.recipe)) {
					return false;
				}

				player.storage.removeItems(_data.recipe);
				player.storage.addItems({ [_data.id]: player.storage.items[_data.id] + 1 });
				return true;
			}
			case 'create_ship': {
				const { ship: generic, shipyard } = _data;
				if (!player.storage.hasItems(generic.recipe)) {
					return false;
				}

				player.storage.removeItems(generic.recipe);
				const ship = new Ship(undefined, player.system, generic.id);
				if (shipyard) {
					ship.position.addInPlace(shipyard.position);
				}

				player.fleet.add(ship);
				return true;
			}
			case 'research': {
				if (player.research[_data.id] >= _data.max || isResearchLocked(_data.id, player)) {
					return false;
				}
				const neededItems = priceOfResearch(_data.id, player.research[_data.id]);
				if (!player.storage.hasItems(neededItems)) {
					return false;
				}

				player.storage.removeItems(neededItems);
				player.research[_data.id]++;
				return true;
			}
			case 'warp': {
				for (const { id, target } of _data) {
					this.getEntityByID<Ship>(id).jumpTo(target);
				}
				return true;
			}
			case 'move': {
				for (const { id, target } of _data) {
					this.getEntityByID<Entity>(id).moveTo(new Vector3(target.x, target.y, target.z));
				}
				return true;
			}
			default:
				logger.warn('Invalid action: ' + _action);
				return false;
		}
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

	public update() {
		resetTickInfo();
		this.sampleTick();
		this.emit('update');

		for (const entity of this.entities) {
			entity.update();
		}
	}

	public toJSON(): LevelJSON {
		const entities: EntityJSON[] = [...this.entities].filter(entity => entity.isSaveable).map(entity => entity.toJSON());
		/**
		 * Note: Sorted to make sure bodies are loaded before ships before players
		 * This prevents `level.getEntityByID(...)` from returning null
		 * Which in turn prevents `.owner = .parent = this` from throwing an error
		 */
		entities.sort((a, b) => {
			const priority = ['Star', 'Planet', 'Hardpoint', 'Ship', 'Player'];
			return priority.indexOf(a.entityType) < priority.indexOf(b.entityType) ? -1 : 1;
		});

		return {
			...pick(this, copy),
			date: new Date().toJSON(),
			systems: [...this.systems.values()].map(system => system.toJSON()),
			entities,
		};
	}

	public fromJSON(json: LevelJSON): void {
		assignWithDefaults(this as Level, pick(json, copy));
		this.date = new Date(json.date);

		logger.log(`Loading ${json.systems.length} system(s)`);
		for (const systemData of json.systems) {
			logger.debug('Loading system ' + systemData.id);
			System.FromJSON(systemData, this);
		}

		logger.log(`Loading ${json.entities.length} entities`);
		const types = [Player, Star, Planet, Fleet, Ship, Waypoint];
		const priorities = types.map(type => type.name);
		json.entities.sort((a, b) => (priorities.indexOf(a.entityType) > priorities.indexOf(b.entityType) ? 1 : -1));
		for (const data of json.entities) {
			if (!priorities.includes(data.entityType)) {
				logger.debug(`Loading ${data.entityType} ${data.id} (skipped)`);
				continue;
			}

			logger.debug(`Loading ${data.entityType} ${data.id}`);
			types[priorities.indexOf(data.entityType)].FromJSON(data, this.systems.get(data.system)!);
		}
	}

	public static FromJSON(json: LevelJSON): Level {
		if (json.version != version) {
			upgradeLevel(json);
		}

		const level = new Level();
		level.fromJSON(json);
		return level;
	}
}

export function upgradeLevel(data: LevelJSON): void {
	switch (data.version) {
		default:
			throw new Error(`Upgrading from ${versions.get(data.version)?.text || data.version} is not supported`);
		case 'alpha_2.0.0':
		case 'alpha_2.0.1':
			data.version = 'alpha_2.0.2';
	}
}
