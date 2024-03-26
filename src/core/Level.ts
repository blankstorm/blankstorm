import type { IVector3Like } from '@babylonjs/core/Maths/math.like';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PerformanceMonitor } from '@babylonjs/core/Misc/performanceMonitor';
import { EventEmitter } from 'eventemitter3';
import type { SerializedSystem } from './System';
import { System } from './System';
import type { SerializedCelestialBody } from './entities/CelestialBody';
import type { Entity, SerializedEntity } from './entities/Entity';
import { Planet, type SerializedPlanet } from './entities/Planet';
import { Player, type SerializedPlayer } from './entities/Player';
import { Ship, type SerializedShip } from './entities/Ship';
import { Star, type SerializedStar } from './entities/Star';
import type { GenericProjectile } from './generic/hardpoints';
import type { Item, ItemID } from './generic/items';
import { isResearchLocked, priceOfResearch, type Research, type ResearchID } from './generic/research';
import type { GenericShip, ShipType } from './generic/ships';
import type { SystemGenerationOptions } from './generic/system';
import type { VersionID } from './metadata';
import { config, version, versions } from './metadata';
import { Berth } from './stations/Berth';
import { random } from './utils';

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

export interface SerializedLevel<S extends SerializedSystem = SerializedSystem> {
	date: string;
	systems: S[];
	difficulty: number;
	version: VersionID;
	name: string;
	id: string;
	entities: SerializedEntity[];
}

export interface LevelEvents {
	body_created: [SerializedCelestialBody];
	body_removed: [SerializedCelestialBody];
	entity_added: [SerializedEntity];
	entity_removed: [SerializedEntity];
	entity_death: [SerializedEntity];
	entity_path_start: [string, IVector3Like[]];
	entity_created: [SerializedEntity];
	player_created: [SerializedPlayer];
	player_levelup: [SerializedPlayer];
	player_items_change: [SerializedPlayer, Record<ItemID, number>];
	player_removed: [SerializedPlayer];
	player_reset: [SerializedPlayer];
	projectile_fire: [string, string, GenericProjectile];
	ship_created: [SerializedShip];
	tick: [];
}

export class Level<S extends System = System> extends EventEmitter<LevelEvents> {
	public id: string = random.hex(16);
	public name: string = '';
	public version = version;
	public date = new Date();
	public difficulty = 1;
	public entities: Set<Entity> = new Set();
	public systems: Map<string, S> = new Map();
	public rootSystem: S;
	protected _initPromise: Promise<Level>;
	protected _performanceMonitor = new PerformanceMonitor(60);

	public constructor() {
		super();

		this._initPromise = this.init();
	}

	public async init(): Promise<Level> {
		return this;
	}

	public async ready(): Promise<this> {
		await Promise.allSettled([this._initPromise]);
		return this;
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
			if (Math.abs(entity.rotation.y) > Math.PI) {
				entity.rotation.y += Math.sign(entity.rotation.y) * 2 * Math.PI;
			}

			entity.position.addInPlace(entity.velocity);
			entity.velocity.scaleInPlace(0.9);

			if (entity instanceof Ship) {
				if (entity.hp <= 0) {
					entity.remove();
					this.emit('entity_death', entity.toJSON());
					continue;
				}
				for (const hardpoint of entity.hardpoints) {
					hardpoint.reload = Math.max(--hardpoint.reload, 0);

					const targets = [...this.entities].filter(e => {
						const distance = Vector3.Distance(e.absolutePosition, entity.absolutePosition);
						return e.isTargetable && e.owner != entity.owner && distance < hardpoint.generic.range;
					}, null);
					const target = targets.reduce((previous, current) => {
						const previousDistance = Vector3.Distance(previous?.absolutePosition ? previous.absolutePosition : Vector3.One().scale(Infinity), entity.absolutePosition);
						const currentDistance = Vector3.Distance(current.absolutePosition, entity.absolutePosition);
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
				entity.jumpCooldown = Math.max(--entity.jumpCooldown, 0);
			}

			if (entity instanceof Berth) {
				entity.productionTime = Math.max(entity.productionTime - 1, 0);
				if (entity.productionTime == 0 && entity.productionID) {
					const ship = new Ship(null, this, { type: entity.productionID });
					ship.position = entity.absolutePosition;
					ship.owner = entity.station.owner;
					entity.productionID = null;
					this.emit('ship_created', ship.toJSON());
				}
			}
		}
	}

	public toJSON(): SerializedLevel {
		return {
			date: new Date().toJSON(),
			systems: [...this.systems.values()].map(system => system.toJSON()) as ReturnType<S['toJSON']>[],
			difficulty: this.difficulty,
			version: this.version,
			name: this.name,
			id: this.id,
			entities: [...this.entities].map(entity => entity.toJSON()),
		};
	}

	public static async upgrade(data: SerializedLevel) {
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

	public static FromJSON(levelData: SerializedLevel, level?: Level): Level {
		if (levelData.version != version) {
			throw new Error(`Can't load level data: wrong version`);
		}

		level ??= new Level();
		level.id = levelData.id;
		level.name = levelData.name;
		level.date = new Date(levelData.date);
		level.version = levelData.version;

		for (const systemData of levelData.systems) {
			System.FromJSON(systemData, level);
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
					Player.FromJSON(<SerializedPlayer>data, level);
					break;
				case 'Ship':
					Ship.FromJSON(<SerializedShip>data, level);
					break;
				case 'Star':
					Star.FromJSON(<SerializedStar>data, level);
					break;
				case 'Planet':
					Planet.FromJSON(<SerializedPlanet>data, level);
					break;
				default:
			}
		}

		return level;
	}
}
