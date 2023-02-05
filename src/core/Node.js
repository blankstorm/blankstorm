import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import { random } from './utils.js';

export default class Node extends EventTarget {
	selected = false;
	isTargetable = false;

	position = Vector3.Zero();
	rotation = Vector3.Zero();
	velocity = Vector3.Zero();

	constructor({ id = random.hex(32), name, position = Vector3.Zero(), rotation = Vector3.Zero(), owner, parent, level }) {
		super();
		Object.assign(this, { id, name, position, rotation, parent, owner, level });
	}

	get absolutePosition() {
		let parent = this,
			position = Vector3.Zero();
		while (parent) {
			position.addInPlace(parent.position);
			parent = parent.owner;
		}

		return position;
	}

	serialize() {
		return {
			id: this.id,
			name: this.name,
			owner: this.owner?.id,
			node_type: this.constructor.name.toLowerCase(),
			position: this.position.asArray().map(num => +num.toFixed(3)),
			rotation: this.rotation.asArray().map(num => +num.toFixed(3)),
		};
	}
}
