import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import { random } from './utils.js';

export default class Node {
	selected = false;
	isTargetable = false;

	position = Vector3.Zero();
	rotation = Vector3.Zero();
	velocity = Vector3.Zero();

	constructor(id, level) {
		id ??= random.hex(32);
		Object.assign(this, { id, level });
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

	serialize() {
		return {
			id: this.id,
			name: this.name ?? '',
			owner: this.owner?.id,
			parent: this.parent?.id,
			node_type: this.constructor.name.toLowerCase(),
			position: this.position.asArray().map(num => +num.toFixed(3)),
			rotation: this.rotation.asArray().map(num => +num.toFixed(3)),
			velocity: this.velocity.asArray().map(num => +num.toFixed(3)),
		};
	}

	static FromData(data, level, constructorOptions) {
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
