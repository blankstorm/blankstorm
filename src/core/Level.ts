import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PerformanceMonitor } from '@babylonjs/core/Misc/performanceMonitor';
import { EventEmitter } from 'eventemitter3';
import type { SerializedSystem } from './System';
import { System } from './System';
import type { Entity } from './entities/Entity';
import type { SystemGenerationOptions } from './generic/system';
import type { VersionID } from './metadata';
import { config, version, versions } from './metadata';
import { randomHex } from './utils';
import { Ship } from './entities/Ship';
import { Berth } from './entities/Berth';
import type { Combat } from './components/combat';

export interface SerializedLevel<S extends SerializedSystem = SerializedSystem> {
	date: string;
	systems: S[];
	difficulty: number;
	version: VersionID;
	name: string;
	id: string;
}

export class Level<S extends System = System> extends EventEmitter {
	public id: string = randomHex(16);
	public name: string = '';
	public version = version;
	public date = new Date();
	public difficulty = 1;
	public systems: Map<string, S> = new Map();
	public entities: Set<Entity> = new Set();
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

	public getEntityByID<E extends Entity = Entity>(id: string): E {
		for (const entity of this.entities) {
			if (entity.id == id) return <E>entity;
		}

		return null;
	}

	public selectEntities(selector: string): Entity[] {
		if (typeof selector != 'string') throw new TypeError('selector must be of type string');
		switch (selector[0]) {
			case '*':
				return [...this.entities];
			case '@':
				return [...this.entities].filter(e => e.name == selector.substring(1));
			case '#':
				return [...this.entities].filter(e => e.id == selector.substring(1));
			case '.':
				return [...this.entities].filter(e => e.constructor.name.toLowerCase().includes(selector.substring(1).toLowerCase()));
			default:
				throw 'Invalid selector';
		}
	}

	public getEntitysBySelectors(...selectors: string[]): Entity[] {
		return selectors.flatMap(selector => this.selectEntities(selector));
	}

	public selectEntity<T extends Entity = Entity>(selector: string): T {
		return <T>this.selectEntities(selector)[0];
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

	/**
	 * @todo Handle entity death items
	 */
	public tick() {
		this.sampleTick();
		this.emit('level.tick');

		for (const entity of this.entities) {
			if (Math.abs(entity.rotation.y) > Math.PI) {
				entity.rotation.y += Math.sign(entity.rotation.y) * 2 * Math.PI;
			}

			entity.position.addInPlace(entity.velocity);
			entity.velocity.scaleInPlace(0.9);

			if (entity.has('combat')) {
				const combat = entity.get<Combat>('combat');
				if (combat.hp <= 0) {
					/* Pseudo-code from Hardpoint.fire on handling entity death

					owner.[fleet | storage].addItems(target.generic.recipe)

					if owner is Player
					{
						owner.xp += target.generic.xp

						if floor of xp->level(entity.xp + target.fleet.generic.xp) > floor xp->level(owner.xp))
						{
							level emit player.levelup
							owner.xpPoints++
						}
					}
					*/
					entity.remove();
					this.emit('entity.death', entity.toJSON());
					continue;
				}
			}

			if (entity.has('hardpoints')) {
				for (const hardpoint of entity.get('hardpoints').points) {
					hardpoint.get('reload').value = Math.max(--hardpoint.get('reload').value, 0);

					const targets = [...this.entities.values()].filter(e => {
						const distance = Vector3.Distance(e.absolutePosition, entity.absolutePosition);
						return e.has('combat') && e.owner != entity.owner && distance < hardpoint.generic.range;
					});
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
			}

			entity.jumpCooldown = Math.max(--entity.jumpCooldown, 0);

			if (entity instanceof Berth) {
				entity.productionTime = Math.max(entity.productionTime - 1, 0);
				if (entity.productionTime == 0 && entity.productionID) {
					const ship = new Ship(null, this, { type: entity.productionID });
					ship.position = entity.absolutePosition;
					ship.owner = entity.station.owner;
					entity.productionID = null;
					this.emit('ship.created', entity.toJSON(), { ship });
				}
			}
		}
		for (const system of this.systems.values()) {
			system.tick();
		}
	}

	public toJSON(): SerializedLevel {
		return {
			date: new Date().toJSON(),
			systems: [...this.systems.values()].map(system => system.toJSON()),
			difficulty: this.difficulty,
			version: this.version,
			name: this.name,
			id: this.id,
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
		return level;
	}
}
