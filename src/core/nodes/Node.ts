import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { random, resolveConstructors } from '../utils';
import type { Level } from '../Level';
import type { System } from '../System';
import EventEmitter from 'eventemitter3';

export type NodeConstructor<T extends Node> = new (...args: ConstructorParameters<typeof Node>) => T;

export interface SerializedNode {
	id: string;
	name: string;
	owner: string;
	parent: string;
	nodeType: string;
	position: number[];
	rotation: number[];
	velocity: number[];
}

export class Node extends EventEmitter {
	id: string;
	private _name = '';

	get name(): string {
		return this._name;
	}

	set name(name: string) {
		this._name = name;
	}

	get nodeType(): string {
		return this.constructor.name;
	}

	get nodeTypes(): string[] {
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
	parent?: Node;
	owner?: Node;

	get level(): Level {
		return this.system.level;
	}

	selected = false;
	isTargetable = false;

	position = Vector3.Zero();
	rotation = Vector3.Zero();
	velocity = Vector3.Zero();

	get absolutePosition() {
		return this.parent instanceof Node ? this.parent.absolutePosition.add(this.position) : this.position;
	}

	get absoluteRotation() {
		return this.parent instanceof Node ? this.parent.absoluteRotation.add(this.rotation) : this.rotation;
	}

	get absoluteVelocity() {
		return this.parent instanceof Node ? this.parent.absoluteVelocity.add(this.rotation) : this.rotation;
	}

	constructor(id: string, system: System, constructorOptions?: object) {
		id ||= random.hex(32);
		super();
		if (constructorOptions) {
			console.warn(`constructorOptions should not be passed to Node constructor`);
		}
		this.id = id;
		this.system = system;
		setTimeout(() => system.emit('node.created', this.toJSON()));
	}

	remove() {
		this.system = null;
	}

	toJSON(): SerializedNode {
		return {
			id: this.id,
			name: this.name,
			owner: this.owner?.id,
			parent: this.parent?.id,
			nodeType: this.nodeType,
			position: this.position.asArray(),
			rotation: this.rotation.asArray(),
			velocity: this.velocity.asArray(),
		};
	}

	static FromJSON(data: SerializedNode, level: System, constructorOptions: object): Node {
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
