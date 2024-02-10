import type { Vector2 } from '@babylonjs/core/Maths/math.vector';
import { Level } from '../core/Level';
import type { SerializedLevel } from '../core/Level';
import type { SystemGenerationOptions } from '../core/generic/system';
import { ClientSystem, SerializedClientSystem } from './system';
import { version } from '../core/metadata';

export interface SerializedClientLevel extends SerializedLevel<SerializedClientSystem> {
	activePlayer: string;
}

export class ClientLevel<S extends ClientSystem = ClientSystem> extends Level<S> {
	protected _isActive = false;
	activePlayer: string;

	get isActive() {
		return this._isActive;
	}

	set isActive(isActive: boolean) {
		this._isActive = isActive;
		this.emit('active');
	}

	isServer = false;

	constructor(name: string) {
		super(name);
	}

	override async generateSystem(name: string, position: Vector2, options?: SystemGenerationOptions): Promise<ClientSystem> {
		const system = new ClientSystem(null, this);
		await super.generateSystem(name, position, options, system);
		return system;
	}

	toJSON(): SerializedClientLevel {
		return Object.assign(super.toJSON(), {
			activePlayer: this.activePlayer,
		}) as SerializedClientLevel;
	}

	static FromJSON(data: SerializedClientLevel, level?: ClientLevel): ClientLevel {
		if (data.version != version) {
			throw new Error(`Can't load level data: wrong version`);
		}

		level ||= new ClientLevel(data.name);
		level.id = data.id;
		level.date = new Date(data.date);
		level.version = data.version;
		level.activePlayer = data.activePlayer;

		for (const systemData of data.systems) {
			ClientSystem.FromJSON(systemData, level);
		}

		return level;
	}
}
