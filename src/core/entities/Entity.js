import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import Path from '../Path.js';
import Node from '../Node.js';
import { LevelEvent } from '../events.js';

export default class Entity extends Node {
	_generic = { speed: 1 };

	selected = false;
	isTargetable = false;

	constructor({ id, name, position, rotation, parent, owner, level }) {
		super({ id, name, position, rotation, owner, parent, level });

		level.entities.set(this.id, this);
	}

	remove() {
		this.level.entities.delete(this.id);
	}

	toString() {
		return `Entity #${this.id}`;
	}

	async moveTo(location, isRelative) {
		if (!(location instanceof Vector3)) throw new TypeError('location must be a Vector3');
		const path = new Path(this.absolutePosition, location.add(isRelative ? this.absolutePosition : Vector3.Zero()), this.level);
		if (path.path.length > 0) {
			const evt = new LevelEvent('entity.follow_path.start', this, { path });
			this.level.dispatchEvent(evt);
			this.position = path.path.at(-1).position.subtract(this.parent.absolutePosition);
			const rotation = Vector3.PitchYawRollToMoveBetweenPoints(path.path.at(-2).position, path.path.at(-1).position);
			rotation.x -= Math.PI / 2
			this.rotation = rotation;
		}
	}

	serialize() {
		return Object.assign(super.serialize(), {
			isTargetable: this.isTargetable,
			selected: this.selected,
		});
	}

	static FromData(data, level) {
		return new this({
			id: data.id,
			name: data.name,
			owner: level.get(data.owner),
			position: Vector3.FromArray(data.position),
			rotation: Vector3.FromArray(data.rotation),
			level,
		});
	}
}
