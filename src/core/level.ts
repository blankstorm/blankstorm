import type { IVector3Like } from '@babylonjs/core/Maths/math.like';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { EntityJSON } from 'deltablank/core/entity.js';
import type { Entity, LevelJSON } from 'deltablank/core/index.js';
import { Level, type LevelEvents } from 'deltablank/core/level.js';
import type { Entries, Expand, UUID } from 'utilium';
import { pick } from 'utilium';
import type { FleetJSON } from './components/fleet';
import type { MovementMixin } from './components/movement';
import type { ItemID, Recipe, Research } from './data';
import { getRecipes, isResearchLocked, scaleResearchRecipe } from './data';
import systemConfig from './data/system.json' with { type: 'json' };
import { Player } from './entities/player';
import type { Ship, ShipConfig } from './entities/ships';
import { ships } from './entities/ships';
import type { Shipyard } from './entities/station';
import type { VersionID } from './metadata';
import { currentVersion, displayVersion } from './metadata';
import type { SystemGeneration, SystemJSON } from './system';
import { System } from './system';
import { logger } from './utils';

export interface MoveInfo<T> {
	id: UUID;
	target: T;
}

export interface BS_LevelJSON extends LevelJSON {
	systems: SystemJSON[];
	version: VersionID;
}

const copy = ['difficulty', 'version', 'name', 'id'] as const satisfies ReadonlyArray<keyof BS_Level>;

declare module 'deltablank/core/level.js' {
	interface LevelEvents {
		entity_path_start: [string, IVector3Like[]];
		fleet_items_change: [FleetJSON, Record<ItemID, number>];
		player_levelup: [EntityJSON];
		player_reset: [EntityJSON];
		update: [];
	}
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
	create_item: Recipe;
	create_ship: { ship: ShipConfig; shipyard?: Shipyard };
	research: Research;
	warp: MoveInfo<System>[];
	move: MoveInfo<IVector3Like>[];
};

export type ActionType = Expand<keyof _ActionsData>;

export type ActionData<T extends ActionType> = _ActionsData[T];

export class BS_Level extends Level {
	public version: VersionID = currentVersion;
	public systems: Map<string, System> = new Map();
	public rootSystem!: System;

	public ready(): Promise<this> {
		return Promise.resolve(this);
	}

	public tryAction<T extends ActionType>(id: UUID, action: T, data: ActionData<T>): boolean {
		const player = this.getEntityByID(id);

		if (!(player instanceof Player)) {
			return false;
		}

		const [_action, _data] = [action, data] as Entries<_ActionsData>[number];

		switch (_action) {
			case 'create_item': {
				if (!player.storage.hasItems(_data.items)) return false;

				player.storage.removeItems(_data.items);
				player.storage.addItems({ [_data.result.id]: _data.result.amount });
				return true;
			}
			case 'create_ship': {
				const { ship: config, shipyard } = _data;
				const recipe = getRecipes(config.name)[0];
				if (!player.storage.hasItems(recipe.items)) {
					return false;
				}

				player.storage.removeItems(recipe.items);

				const ship = new ships[config.name](undefined, player.level);
				if (shipyard) {
					ship.position.addInPlace(shipyard.position);
				}

				player.fleet.add(ship);
				return true;
			}
			case 'research': {
				if (player.research[_data.id] >= _data.max_level || isResearchLocked(_data.id, player)) {
					return false;
				}
				const recipe = scaleResearchRecipe(_data.id, player.research[_data.id]);
				if (!player.storage.hasItems(recipe.items)) {
					return false;
				}

				player.storage.removeItems(recipe.items);
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
					this.getEntityByID<Entity & MovementMixin>(id).moveTo(new Vector3(target.x, target.y, target.z));
				}
				return true;
			}
			default:
				logger.warn('Invalid action: ' + _action);
				return false;
		}
	}

	public async generateSystem(
		name: string,
		position: Vector2,
		options: SystemGeneration = systemConfig,
		system?: System
	): Promise<System> {
		const difficulty = Math.max(Math.log10(Vector2.Distance(Vector2.Zero(), position)) - 1, 0.25);
		system = await System.Generate(name, { ...options, difficulty }, this, system);
		system.position = position;
		return system;
	}

	public toJSON(): BS_LevelJSON {
		const entities: EntityJSON[] = [...this.entities].map(entity => entity.toJSON());
		/**
		 * Note: Sorted to make sure natural bodies are loaded before ships before players
		 * This prevents `level.getEntityByID(...)` from returning null
		 * Which in turn prevents `.owner = .parent = this` from throwing an error
		 */
		entities.sort((a, b) => {
			const priority = ['Star', 'Planet', 'Hardpoint', 'Ship', 'Player'];
			return priority.indexOf(a.type) < priority.indexOf(b.type) ? -1 : 1;
		});

		return {
			...pick(this, copy),
			date: new Date().toJSON(),
			systems: [...this.systems.values()].map(system => system.toJSON()),
			entities,
		};
	}

	public async load(json: BS_LevelJSON): Promise<void> {
		await super.load(json);
		logger.info(`Loading ${json.systems.length} system(s)`);
		for (const systemData of json.systems) {
			logger.debug('Loading system ' + systemData.id);
			System.FromJSON(systemData, this);
		}
	}

	public static async FromJSON(json: BS_LevelJSON): Promise<BS_Level> {
		if (json.version != currentVersion) upgradeLevel(json);

		const level = new BS_Level();
		await level.load(json);
		return level;
	}
}

export function upgradeLevel(data: BS_LevelJSON): void {
	switch (data.version) {
		default:
			throw new Error(`Upgrading from ${displayVersion(data.version)} is not supported`);
		case 'alpha_2.0.0':
		case 'alpha_2.0.1':
		case 'alpha_2.0.2':
			data.version = 'alpha_2.0.3';
	}
}
