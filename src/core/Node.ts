import { Vector3 } from '@babylonjs/core/Maths/math.vector';

import { random } from './utils';
import type { Level } from './Level';

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

export class Node {
	id: string;
	name = '';

	level: Level;
	parent?: Node;
	owner?: Node;

	selected = false;
	isTargetable = false;

	position = Vector3.Zero();
	rotation = Vector3.Zero();
	velocity = Vector3.Zero();

	constructor(id: string = random.hex(32), level: Level, constructorOptions?: object) {
		if (constructorOptions) {
			console.warn(`constructorOptions should not be passed to Node constructor`);
		}
		this.id = id;
		this.level = level;
		level.nodes.set(id, this);
	}

	get absolutePosition() {
		return this.parent instanceof Node ? this.parent.absolutePosition.add(this.position) : this.position;
	}

	get absoluteRotation() {
		return this.parent instanceof Node ? this.parent.absoluteRotation.add(this.rotation) : this.rotation;
	}

	get absoluteVelocity() {
		return this.parent instanceof Node ? this.parent.absoluteVelocity.add(this.rotation) : this.rotation;
	}

	remove() {
		this.level.nodes.delete(this.id);
	}

	serialize(): SerializedNode {
		return {
			id: this.id,
			name: this.name,
			owner: this.owner?.id,
			parent: this.parent?.id,
			node_type: this.constructor.name.toLowerCase(),
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
