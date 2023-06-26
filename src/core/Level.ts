import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import { PerformanceMonitor } from '@babylonjs/core/Misc/performanceMonitor';

import { random } from './utils';
import { version, versions, config } from './meta';
import type { VersionID } from './meta';

import { System } from './System';
import type { SerializedSystem } from './System';
import type { SystemGenerationOptions } from './generic/system';
import { EventEmitter } from 'eventemitter3';

export interface SerializedLevel<S extends SerializedSystem = SerializedSystem> {
	date: string;
	systems: S[];
	difficulty: number;
	version: VersionID;
	name: string;
	id: string;
}

export class Level<S extends System = System> extends EventEmitter {
	id = random.hex(16);
	version = version;
	date = new Date();
	difficulty = 1;
	systems: Map<string, S> = new Map();
	rootSystem: S;
	#initPromise: Promise<Level>;
	#performanceMonitor = new PerformanceMonitor(60);

	constructor(public name: string = '') {
		super();

		this.#initPromise = this.init();
	}

	async init(): Promise<Level> {
		return this;
	}

	async ready(): Promise<this> {
		await Promise.allSettled([this.#initPromise]);
		return this;
	}

	getNodeSystem(id: string): S {
		for (const system of this.systems.values()) {
			if (system.nodes.has(id)) {
				return system;
			}
		}

		return this.rootSystem;
	}

	async generateSystem(name: string, position: Vector2, options: SystemGenerationOptions = config.system_generation, system?: System) {
		const difficulty = Math.max(Math.log10(Vector2.Distance(Vector2.Zero(), position)) - 1, 0.25);
		system = await System.Generate(name, { ...options, difficulty }, this, system);
		system.position = position;
		return system;
	}

	//events and ticking
	get tps(): number {
		return this.#performanceMonitor.averageFPS;
	}

	sampleTick() {
		this.#performanceMonitor.sampleFrame();
	}

	tick() {
		this.sampleTick();
		this.emit('level.tick');
		for (const system of this.systems.values()) {
			system.tick();
		}
	}

	toJSON(): SerializedLevel {
		return {
			date: new Date().toJSON(),
			systems: [...this.systems.values()].map(system => system.toJSON()) as ReturnType<S['toJSON']>[],
			difficulty: this.difficulty,
			version: this.version,
			name: this.name,
			id: this.id,
		};
	}

	static async upgrade(data: SerializedLevel) {
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

	static FromJSON(levelData: SerializedLevel, level?: Level): Level {
		if (levelData.version != version) {
			throw new Error(`Can't load level data: wrong version`);
		}

		level ??= new Level(levelData.name);
		level.id = levelData.id;
		level.date = new Date(levelData.date);
		level.version = levelData.version;

		for (const systemData of levelData.systems) {
			System.FromJSON(systemData, level);
		}
		return level;
	}
}
