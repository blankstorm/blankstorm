import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import type { System } from './system.js';
import type { CelestialBody } from './entities/body.js';
import type { Entity } from './entities/entity.js';
import { logger } from './utils.js';

function radius(entity: Entity) {
	return 1.3 * (entity.isType<CelestialBody>('CelestialBody') ? entity.radius : 10);
}

export function findPath(start: Vector3, end: Vector3, system: System): Vector3[] {
	let intersector: Entity | undefined,
		intersectorDistance: number = Infinity;

	for (const entity of system.entities()) {
		if (!entity.isObstacle) {
			continue;
		}

		const relative = entity.absolutePosition.subtract(start),
			entityDistance = relative.length();

		if (intersectorDistance < entityDistance) {
			continue;
		}

		const lineDirection = end.subtract(start).normalize();
		const projection = Vector3.Dot(relative, lineDirection);

		if (projection <= 0 || projection >= Vector3.Distance(start, end)) {
			continue;
		}

		const distance = Vector3.Distance(start.add(lineDirection.scale(projection)), entity.absolutePosition);

		if (distance > radius(entity)) {
			continue;
		}

		logger.debug(`Path: avoiding ${entity.entityType} ${entity.id} ("${entity.name}")`);
		intersector = entity;
		intersectorDistance = entityDistance;
	}

	if (!intersector) {
		// Direct path available, return start and end points
		return [start, end];
	}

	// Get a side point to navigate around the entity

	const offsetDirection = intersector.absolutePosition.subtract(start).normalize();

	const sidePoint = new Vector3(-offsetDirection.z, 0, offsetDirection.x).scaleInPlace(radius(intersector)).addInPlace(intersector.absolutePosition);

	return [start, ...findPath(sidePoint, end, system)];
}
