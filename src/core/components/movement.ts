import type { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Component, registerComponent } from 'deltablank/core/component.js';
import type { Entity } from 'deltablank/core/entity.js';
import { findPath } from '../path';

export interface MovementMixin {
	moveTo(this: Entity & MovementMixin, target: Vector3): void;
}

@registerComponent
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export class Movement extends Component<MovementMixin, {}, { speed: number; agility: number }> {
	/**
	 * Starts moving the entity to the position
	 * @param target The position the entity should move to
	 * @param isRelative Whether the target is a change to the current position (i.e. a "delta" vector) or absolute
	 */
	protected moveTo(this: Entity & MovementMixin, target: Vector3): void {
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
}
