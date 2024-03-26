import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { random, resolveConstructors } from '../utils';
import type { Level } from '../Level';
import type { System } from '../System';
import EventEmitter from 'eventemitter3';
import { findPath } from '../path';

export type EntityConstructor<T extends Entity> = new (...args: ConstructorParameters<typeof Entity>) => T;

export interface SerializedEntity {
	id: string;
	name: string;
	owner: string;
	parent: string;
	nodeType: string;
	position: number[];
	rotation: number[];
	velocity: number[];
	selected: boolean;
	isTargetable: boolean;
}

export class Entity extends EventEmitter {
	public id: string;

	private _name = '';

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

	protected _system: System;
	public get system(): System {
		return this._system;
	}
	public set system(value: System) {
		if (this._system) {
			this._system.nodes.delete(this.id);
			this._system.emit('node.removed', this.toJSON());
		}
		this._system = value;
		if (value) {
			value.nodes.set(this.id, this);
			setTimeout(() => value.emit('node.added', this.toJSON()));
		}
	}
	public parent?: Entity;
	public owner?: Entity;

	public get level(): Level {
		return this.system.level;
	}

	public selected = false;
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

	public constructor(id: string, system: System, constructorOptions?: object) {
		id ||= random.hex(32);
		super();
		if (constructorOptions) {
			console.warn(`constructorOptions should not be passed to Node constructor`);
		}
		this.id = id;
		this.system = system;
		setTimeout(() => system.emit('node.created', this.toJSON()));
	}

	public remove() {
		this.system = null;
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
			this.system.emit(
				'entity.follow_path.start',
				this.id,
				path.map(({ x, y, z }) => ({ x, y, z }))
			);
			this.position = path.at(-1).subtract(this.parent.absolutePosition);
			const rotation = Vector3.PitchYawRollToMoveBetweenPoints(path.at(-2), path.at(-1));
			rotation.x -= Math.PI / 2;
			this.rotation = rotation;
		}
	}

	public toJSON(): SerializedEntity {
		return {
			id: this.id,
			name: this.name,
			owner: this.owner?.id,
			parent: this.parent?.id,
			nodeType: this.nodeType,
			position: this.position.asArray(),
			rotation: this.rotation.asArray(),
			velocity: this.velocity.asArray(),
			isTargetable: this.isTargetable,
			selected: this.selected,
		};
	}

	public static FromJSON(data: SerializedEntity, level: System, constructorOptions: object): Entity {
		const node = new this(data.id, level, constructorOptions);
		node.position = Vector3.FromArray(data.position || [0, 0, 0]);
		node.rotation = Vector3.FromArray(data.rotation || [0, 0, 0]);
		node.velocity = Vector3.FromArray(data.velocity || [0, 0, 0]);
		node.parent = level.getNodeByID(data.parent);
		node.owner = level.getNodeByID(data.owner);
		node.name = data.name;
		return node;
	}
}
