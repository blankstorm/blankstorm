import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import EventEmitter from 'eventemitter3';
import type { ItemContainer } from '../generic/items';
import type { Level } from '../level';
import { findPath } from '../path';
import type { ItemStorage } from '../storage';
import type { System } from '../system';
import { randomHex, resolveConstructors } from '../utils';

export type EntityConstructor<T extends Entity> = new (...args: ConstructorParameters<typeof Entity>) => T;

export interface EntityJSON {
	id: string;
	name: string;
	system: string;
	owner: string;
	parent: string;
	nodeType: string;
	position: number[];
	rotation: number[];
	velocity: number[];
	isSelected: boolean;
	isTargetable: boolean;
	storage?: ItemContainer;
}

export class Entity extends EventEmitter {
	public get [Symbol.toStringTag](): string {
		return this.constructor.name;
	}

	protected _name: string;

	public get name(): string {
		return this._name;
	}

	public set name(name: string) {
		this._name = name;
	}

	public get nodeType(): string {
		return this.constructor.name;
	}

	public get nodeTypes(): string[] {
		return resolveConstructors(this);
	}

	protected _level: Level;
	public get level(): Level {
		return this._level;
	}
	public set level(value: Level) {
		if (this._level) {
			this._level.entities.delete(this);
			this._level.emit('entity_removed', this.toJSON());
		}
		this._level = value;
		if (value) {
			value.entities.add(this);
			setTimeout(() => value.emit('entity_added', this.toJSON()));
		}
	}

	protected _system: string;
	public get system(): System {
		return this.level.systems.get(this._system);
	}
	public set system(value: System | string) {
		this._system = typeof value == 'object' ? value?.id : value;
	}

	public parent?: Entity;
	public owner?: Entity;

	protected _storage?: ItemStorage;
	public get storage(): ItemStorage {
		if (!this._storage) {
			throw new ReferenceError('Storage does not exist on ' + this);
		}
		return this._storage;
	}

	public isSelected = false;
	public isTargetable = false;

	public position = Vector3.Zero();
	public rotation = Vector3.Zero();
	public velocity = Vector3.Zero();

	public get absolutePosition() {
		return this.parent instanceof Entity ? this.parent.absolutePosition.add(this.position) : this.position;
	}

	public get absoluteRotation() {
		return this.parent instanceof Entity ? this.parent.absoluteRotation.add(this.rotation) : this.rotation;
	}

	public get absoluteVelocity() {
		return this.parent instanceof Entity ? this.parent.absoluteVelocity.add(this.rotation) : this.rotation;
	}

	public constructor(
		public id: string = randomHex(32),
		level: Level,
		constructorOptions?: object
	) {
		super();
		this.id ||= randomHex(32);
		if (constructorOptions) {
			console.warn(`constructorOptions should not be passed to Node constructor`);
		}
		this.level = level;
		setTimeout(() => level.emit('entity_created', this.toJSON()));
	}

	public remove() {
		this.level = null;
	}

	/**
	 *
	 * @param target The position the entity should move to
	 * @param isRelative Wheter the target is a change to the current position (i.e. a "delta" vector) or absolute
	 */
	public async moveTo(target: Vector3, isRelative = false) {
		if (!(target instanceof Vector3)) throw new TypeError('target must be a Vector3');
		const path = findPath(this.absolutePosition, target.add(isRelative ? this.absolutePosition : Vector3.Zero()), this.system);
		if (path.length > 0) {
			this.level.emit(
				'entity_path_start',
				this.id,
				path.map(({ x, y, z }) => ({ x, y, z }))
			);
			this.position = path.at(-1).subtract(this.parent.absolutePosition);
			const rotation = Vector3.PitchYawRollToMoveBetweenPoints(path.at(-2), path.at(-1));
			rotation.x -= Math.PI / 2;
			this.rotation = rotation;
		}
	}

	public toJSON(): EntityJSON {
		return {
			id: this.id,
			name: this.name,
			system: this.system?.id,
			owner: this.owner?.id,
			parent: this.parent?.id,
			nodeType: this.nodeType,
			position: this.position.asArray(),
			rotation: this.rotation.asArray(),
			velocity: this.velocity.asArray(),
			isTargetable: this.isTargetable,
			isSelected: this.isSelected,
		};
	}

	public from(data: Partial<EntityJSON>, level: Level): void {
		this.id = data.id || this.id;
		this.name = data.name || this.name;
		this.system = level.systems.get(data.system) || this.system;
		this.position = Vector3.FromArray(data.position || this.position?.asArray());
		this.rotation = Vector3.FromArray(data.rotation || this.rotation?.asArray());
		this.velocity = Vector3.FromArray(data.velocity || this.velocity?.asArray());
		this.parent = level.getEntityByID(data.parent) || this.parent;
		this.owner = level.getEntityByID(data.owner) || this.owner;
	}

	public static From<const T extends Entity = Entity>(this: EntityConstructor<T>, data: EntityJSON, level: Level, constructorOptions?: object): T {
		const entity = new this(data.id, level, constructorOptions);
		entity.from(data, level);
		return entity;
	}
}
