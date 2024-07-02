import type { IVector3Like } from '@babylonjs/core/Maths/math.like';
import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import { PerformanceMonitor } from '@babylonjs/core/Misc/performanceMonitor';
import { EventEmitter } from 'eventemitter3';
import { assignWithDefaults, pick, randomHex, type Shift } from 'utilium';
import type { Component } from './components/component';
import type { FleetJSON } from './components/fleet';
import { filterEntities, loadingPriorities, type Entity, type EntityJSON } from './entities/entity';
import { Planet } from './entities/planet';
import { Player, type PlayerJSON } from './entities/player';
import { Ship } from './entities/ship';
import { Star } from './entities/star';
import type { GenericProjectile } from './generic/hardpoints';
import type { Item, ItemID } from './generic/items';
import { isResearchLocked, priceOfResearch, type Research, type ResearchID } from './generic/research';
import type { GenericShip } from './generic/ships';
import type { SystemGenerationOptions } from './generic/system';
import type { VersionID } from './metadata';
import { config, version, versions } from './metadata';
import type { Berth } from './stations/berth';
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
	entity_created: [EntityJSON];
	fleet_items_change: [FleetJSON, Record<ItemID, number>];
	player_levelup: [PlayerJSON];
	player_reset: [PlayerJSON];
	projectile_fire: [string, string, GenericProjectile];
	update: [];
}

export const levelEventNames = [
	'entity_added',
	'entity_removed',
	'entity_death',
	'entity_path_start',
	'entity_created',
	'fleet_items_change',
	'player_levelup',
	'player_reset',
	'projectile_fire',
	'update',
] as const;

export class Level extends EventEmitter<LevelEvents> implements Component<LevelJSON> {
	public id: string = randomHex(16);
	public name: string = '';
	public version = version;
	public date = new Date();
	public difficulty = 1;
	public entities: Set<Entity> = new Set();
	public systems: Map<string, System> = new Map();
	public rootSystem: System;
	protected _performanceMonitor = new PerformanceMonitor(60);

	public async ready(): Promise<this> {
		return this;
	}

	public getEntityByID<N extends Entity = Entity>(id: string): N {
		for (const entity of this.entities) {
			if (entity.id == id) return <N>entity;
		}

		throw new ReferenceError('Entity does not exist');
	}

	public selectEntities(selector: string): Set<Entity> {
		return filterEntities(this.entities, selector);
	}

	public entity<T extends Entity = Entity>(selector: string): T {
		return this.selectEntities(selector).values().next().value;
	}

	public _try_create_item(player: Player, item: Item): boolean {
		if (!item.recipe || !player.storage.hasItems(item.recipe)) {
			return false;
		}

		player.storage.removeItems(item.recipe);
		player.storage.addItems({ [item.id]: player.storage.items[item.id] + 1 });
		return true;
	}

	public _try_create_ship(player: Player, generic: GenericShip, berth?: Berth): boolean {
		if (!player.storage.hasItems(generic.recipe)) {
			return false;
		}

		player.storage.removeItems(generic.recipe);
		const ship = new Ship(undefined, player.level, generic.id);
		player.fleet.add(ship);
		return true;
	}

	public _try_research(player: Player, data: Research): boolean {
		if (player.research[data.id] >= data.max || isResearchLocked(<ResearchID>data.id, player)) {
			return false;
		}
		const neededItems = priceOfResearch(<ResearchID>data.id, player.research[data.id]);
		if (!player.storage.hasItems(neededItems)) {
			return false;
		}

		player.storage.removeItems(neededItems);
		player.research[data.id]++;
		return true;
	}

	public _try_warp(player: Player, data: MoveInfo<System>[]): void {
		for (const { id, target } of data) {
			this.getEntityByID<Ship>(id).jumpTo(target);
		}
	}

	public _try_move(player: Player, data: MoveInfo<Vector3>[]): void {
		for (const { id, target } of data) {
			this.getEntityByID<Entity>(id).moveTo(target);
		}
	}

	public tryAction<T extends Action>(id: string, action: T, ...args: ActionParameters<T>): boolean {
		const player = this.getEntityByID(id);

		if (!(player instanceof Player)) {
			return false;
		}

		if (!('_try_' + action in this)) {
			return false;
		}

		return this['_try_' + action](player, ...args);
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
		this.sampleTick();
		this.emit('update');

		for (const entity of this.entities) {
			entity.update();
		}
	}

	public toJSON(): LevelJSON {
		const entities: EntityJSON[] = [...this.entities].map(e => e.toJSON());
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
		json.entities.sort((a, b) => (loadingPriorities.indexOf(a.entityType) > loadingPriorities.indexOf(b.entityType) ? 1 : -1));
		for (const data of json.entities) {
			const types = { Player, Ship, Star, Planet };
			if (!Object.hasOwn(types, data.entityType)) {
				logger.debug(`Loading ${data.entityType} ${data.id} (skipped)`);
				continue;
			}

			logger.debug(`Loading ${data.entityType} ${data.id}`);
			types[data.entityType as keyof typeof types].FromJSON(data, this);
		}
	}

	public static FromJSON(json: LevelJSON): Level {
		if (json.version != version) {
			throw new Error('Can not load level data: wrong version');
		}

		const level = new Level();
		level.fromJSON(json);
		return level;
	}
}

export type Action = 'create_item' | 'create_ship' | 'research' | 'warp' | 'move';

export type ActionParameters<T extends Action> = Shift<Parameters<Level[`_try_${T}`]>>;

export function upgradeLevel(data: LevelJSON): LevelJSON {
	switch (data.version) {
		default:
			throw `Upgrading from ${versions.get(data.version)?.text || data.version} is not supported`;
	}
}
