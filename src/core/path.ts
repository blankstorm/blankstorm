import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Entity } from 'deltablank/core/entity.js';
import type { System } from './system';
import { logger } from './utils';

function radius(entity: Entity & { radius?: number }): number {
	return 1.3 * (entity.radius || 10);
}

export function findPath(start: Vector3, end: Vector3, system?: System): Vector3[] {
	let intersector: Entity | undefined,
		intersectorDistance: number = Infinity;

	if (!system) return [start, end];

	for (const entity of system.entities()) {
		if (!entity.isObstacle) continue;

		const relative = entity.absolutePosition.subtract(start),
			entityDistance = relative.length();

		if (intersectorDistance < entityDistance) continue;

		const lineDirection = end.subtract(start).normalize();
		const projection = Vector3.Dot(relative, lineDirection);

		if (projection <= 0 || projection >= Vector3.Distance(start, end)) continue;

		const distance = Vector3.Distance(start.add(lineDirection.scale(projection)), entity.absolutePosition);

		if (distance > radius(entity)) continue;

		logger.debug(`Path: avoiding ${entity.type} ${entity.id} ("${entity.name}")`);
		intersector = entity;
		intersectorDistance = entityDistance;
	}

	// Direct path available, return start and end points
	if (!intersector) return [start, end];

	// Get a side point to navigate around the entity

	const offsetDirection = intersector.absolutePosition.subtract(start).normalize();

	const sidePoint = new Vector3(-offsetDirection.z, 0, offsetDirection.x)
		.scaleInPlace(radius(intersector))
		.addInPlace(intersector.absolutePosition);

	return [start, ...findPath(sidePoint, end, system)];
}
