import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { EventEmitter } from 'eventemitter3';
import { assignWithDefaults, pick, randomHex, resolveConstructors, type Tuple } from 'utilium';
import { register, type Component } from '../components/component.js';
import type { ItemStorage } from '../components/storage.js';
import type { ItemContainer } from '../generic/items.js';
import type { Level } from '../level.js';
import { findPath } from '../path.js';
import type { System } from '../system.js';
import type { CelestialBody } from './body.js';
import type { Player } from './player.js';

export const tickInfo = {
	updates: 0,
	additions: 0,
	deletions: 0,
};

export function resetTickInfo(): void {
	tickInfo.updates = 0;
	tickInfo.additions = 0;
	tickInfo.deletions = 0;
}

export interface EntityJSON {
	id: string;
	name: string;
	system: string;
	owner?: string;
	parent?: string;
	entityType: string;
	position: readonly number[];
	rotation: readonly number[];
	velocity: readonly number[];
	isSelected: boolean;
	isTargetable: boolean;
	path?: Tuple<number, 3>[];
	storage?: ItemContainer;
}

const copy = ['id', 'name', 'entityType', 'isSelected', 'isTargetable'] as const satisfies ReadonlyArray<keyof Entity>;

@register
export class Entity
	extends EventEmitter<{
		update: [];
		created: [];
	}>
	implements Component<EntityJSON>
{
	public get [Symbol.toStringTag](): string {
		return this.constructor.name;
	}

	public name: string = '';

	public get entityType(): string {
		return this.constructor.name;
	}

	public get entityTypes(): string[] {
		return resolveConstructors(this);
	}

	public isType<T extends Entity>(...types: string[]): this is T {
		return types.some(type => this.entityTypes.includes(type));
	}

	public parent?: Entity;

	protected _owner?: CelestialBody | Player;
	public get owner(): CelestialBody | Player | undefined {
		return this._owner;
	}

	public set owner(value: CelestialBody | Player | undefined) {
		this._owner = value;
	}

	protected _storage?: ItemStorage;
	public get storage(): ItemStorage {
		if (!this._storage) {
			throw new ReferenceError('Storage does not exist on entity ' + this.id);
		}
		return this._storage;
	}

	public isSelected: boolean = false;
	public isTargetable: boolean = false;

	protected _isSaveable: boolean = true;

	public get isSaveable(): boolean {
		return this._isSaveable;
	}

	public readonly isObstacle: boolean = true;

	public position: Vector3 = Vector3.Zero();
	public rotation: Vector3 = Vector3.Zero();
	public velocity: Vector3 = Vector3.Zero();

	public get absolutePosition(): Vector3 {
		return this.parent instanceof Entity ? this.parent.absolutePosition.add(this.position) : this.position;
	}

	public get absoluteRotation(): Vector3 {
		return this.parent instanceof Entity ? this.parent.absoluteRotation.add(this.rotation) : this.rotation;
	}

	public get absoluteVelocity(): Vector3 {
		return this.parent instanceof Entity ? this.parent.absoluteVelocity.add(this.rotation) : this.rotation;
	}

	public readonly level: Level;

	public constructor(
		public id: string = randomHex(32),
		public system: System
	) {
		super();
		this.id ||= randomHex(32);
		tickInfo.additions++;
		this.level = system.level;
		this.level.entities.add(this);

		setTimeout(() => this.emit('created'));
	}

	public update(): void {
		tickInfo.updates++;
		if (Math.abs(this.rotation.y) > Math.PI) {
			this.rotation.y += Math.sign(this.rotation.y) * 2 * Math.PI;
		}

		if (this._path.length) {
			this.velocity.addInPlace(this._path[0].normalizeToNew());
			if (Vector3.Distance(this.position, this._path[0]) < 1) {
				this._path.shift()!;
				const rotation = Vector3.PitchYawRollToMoveBetweenPoints(this.position, this._path[0]);
				rotation.x -= Math.PI / 2;
				this.rotation.copyFrom(rotation);
			}
		}

		this.position.addInPlace(this.velocity);
		this.emit('update');
	}

	public remove(): void {
		tickInfo.deletions++;
		this.level.entities.delete(this);
		this.level.emit('entity_removed', this.toJSON());
	}

	/**
	 * Used when moving.
	 */
	protected _path: Vector3[] = [];

	/**
	 * Starts moving the entity to the position
	 * @param target The position the entity should move to
	 * @param isRelative Whether the target is a change to the current position (i.e. a "delta" vector) or absolute
	 */
	public moveTo(target: Vector3): void {
		const path = findPath(this.absolutePosition, target, this.system);
		if (!path.length) {
			return;
		}
		this.level.emit(
			'entity_path_start',
			this.id,
			path.map(({ x, y, z }) => ({ x, y, z }))
		);
	}

	public toJSON(): EntityJSON {
		return {
			...pick(this, copy),
			system: this.system?.id,
			owner: this.owner?.id,
			parent: this.parent?.id,
			position: this.position.asArray(),
			rotation: this.rotation.asArray(),
			velocity: this.velocity.asArray(),
		};
	}

	public fromJSON(data: Partial<EntityJSON>): void {
		for (const vec of ['position', 'rotation', 'velocity'] as const) {
			data[vec] && this[vec].fromArray(data[vec]);
		}
		assignWithDefaults(this as Entity, {
			...pick(data, copy),
			parent: data.parent ? this.level.getEntityByID(data.parent) : undefined,
			owner: data.owner ? this.level.getEntityByID<CelestialBody | Player>(data.owner) : undefined,
		});
		if (data.system) {
			this.system = this.level.systems.get(data.system)!;
		}
	}

	public static FromJSON(data: Partial<EntityJSON>, system: System): Entity {
		const entity = new this(data.id, system);
		entity.fromJSON(data);
		return entity;
	}
}

export function filterEntities(entities: Iterable<Entity>, selector: string): Set<Entity> {
	if (typeof selector != 'string') {
		throw new TypeError('selector must be of type string');
	}

	if (selector == '*') {
		return new Set(entities);
	}

	const selected = new Set<Entity>();
	for (const entity of entities) {
		switch (selector[0]) {
			case '@':
				if (entity.name == selector.slice(1)) selected.add(entity);
				break;
			case '#':
				if (entity.id == selector.slice(1)) selected.add(entity);
				break;
			case '.':
				for (const type of entity.entityTypes) {
					if (type.toLowerCase().includes(selector.slice(1).toLowerCase())) {
						selected.add(entity);
					}
				}
				break;
			default:
				throw 'Invalid selector';
		}
	}
	return selected;
}
