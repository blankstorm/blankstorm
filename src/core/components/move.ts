import { Vector3 } from '@babylonjs/core';
import { findPath } from '../Path';
import { NullComponent, register } from './component';

@register()
export class Move extends NullComponent {
	/**
	 *
	 * @param point The position the entity should move to
	 * @param isRelative Wheter the target is a change to the current position (i.e. a "delta" vector) or absolute
	 */
	public async moveTo(point: Vector3, isRelative = false) {
		if (!(point instanceof Vector3)) throw new TypeError('target must be a Vector3');
		const path = findPath(this._.absolutePosition, point.add(isRelative ? this._.absolutePosition : Vector3.Zero()), this._.system);
		if (path.path.length > 0) {
			this._.level.emit('entity.follow_path.start', this._.id, path.toJSON());
			this._.position = path.path.at(-1).position.subtract(this._.parent.absolutePosition);
			const rotation = Vector3.PitchYawRollToMoveBetweenPoints(path.path.at(-2).position, path.path.at(-1).position);
			rotation.x -= Math.PI / 2;
			this._.rotation = rotation;
		}
	}
}
