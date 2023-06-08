import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { random } from './utils';
import type { Level } from './Level';
import { EventData, LevelEvent } from './events';

export type NodeConstructor<T extends Node> = new (...args: ConstructorParameters<typeof Node>) => T;

export interface SerializedNode {
	id: string;
	name: string;
	owner: string;
	parent: string;
	node_type: string;
	position: number[];
	rotation: number[];
	velocity: number[];
}

export class Node extends EventTarget {
	id: string;
	private _name = '';

	get name(): string {
		return this._name;
	}

	set name(name: string) {
		this._name = name;
	}

	get node_type(): string {
		return this.constructor.name.toLowerCase();
	}

	level: Level;
	parent?: Node;
	owner?: Node;

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

	constructor(id: string = random.hex(32), level: Level, constructorOptions?: object) {
		super();
		if (constructorOptions) {
			console.warn(`constructorOptions should not be passed to Node constructor`);
		}
		this.id = id || random.hex(32);
		this.level = level;
		level.nodes.set(id, this);
		setTimeout(() => level.emit('node.created', this.serialize()));
	}

	emit(type: string, data?: EventData): boolean {
		const event = new LevelEvent(type, this.serialize(), data, this.level);
		return super.dispatchEvent(event);
	}

	remove() {
		this.level.emit('node.removed', this.serialize());
		this.level.nodes.delete(this.id);
	}

	serialize(): SerializedNode {
		return {
			id: this.id,
			name: this.name,
			owner: this.owner?.id,
			parent: this.parent?.id,
			node_type: this.node_type,
			position: this.position.asArray(),
			rotation: this.rotation.asArray(),
			velocity: this.velocity.asArray(),
		};
	}

	static FromData(data: SerializedNode, level: Level, constructorOptions: object): Node {
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
