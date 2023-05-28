import { Vector3 } from '@babylonjs/core/Maths/math.vector';

import Path from '../Path';
import { Node } from '../Node';
import type { SerializedNode } from '../Node';
import type { Level } from '../Level';

export interface SerializedEntity extends SerializedNode {
	selected: boolean;
	isTargetable: boolean;
}

export class Entity extends Node {
	selected = false;
	isTargetable = false;

	constructor(id: string, level: Level) {
		super(id, level);
		level.entities.set(this.id, this);
		setTimeout(() => level.emit('entity.created', this.serialize()));
	}

	remove() {
		this.level.emit('entity.removed', this.serialize());
		this.level.entities.delete(this.id);
	}

	toString() {
		return `Entity #${this.id}`;
	}

	async moveTo(location, isRelative) {
		if (!(location instanceof Vector3)) throw new TypeError('location must be a Vector3');
		const path = Path.Find(this.absolutePosition, location.add(isRelative ? this.absolutePosition : Vector3.Zero()), this.level);
		if (path.path.length > 0) {
			this.level.emit('entity.follow_path.start', this.serialize(), { path: path.serialize() });
			this.position = path.path.at(-1).position.subtract(this.parent.absolutePosition);
			const rotation = Vector3.PitchYawRollToMoveBetweenPoints(path.path.at(-2).position, path.path.at(-1).position);
			rotation.x -= Math.PI / 2;
			this.rotation = rotation;
		}
	}

	serialize(): SerializedEntity {
		return Object.assign(super.serialize(), {
			isTargetable: this.isTargetable,
			selected: this.selected,
		});
	}

	static FromData(data: SerializedEntity, level: Level, constructorOptions: object) {
		return super.FromData(data, level, constructorOptions);
	}
}
