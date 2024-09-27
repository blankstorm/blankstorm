import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { System } from './system';
import type { CelestialBody } from './entities/body';
import type { Entity } from './entities/entity';
import { logger } from './utils';

function radius(entity: Entity) {
	return 10 + (entity.isType<CelestialBody>('CelestialBody') ? entity.radius : 10);
}

function lineIntersectsEntity(start: Vector3, end: Vector3, entity: Entity): boolean {
	const closestPoint = entity.absolutePosition.subtract(start);
	const lineDirection = end.subtract(start).normalize();
	const projection = Vector3.Dot(closestPoint, lineDirection);

	if (projection <= 0 || projection >= Vector3.Distance(start, end)) {
		return false;
	}

	return Vector3.Distance(start.add(lineDirection.scale(projection)), entity.absolutePosition) <= radius(entity);
}

export function findPath(start: Vector3, end: Vector3, system: System): Vector3[] {
	let intersector: Entity | null = null;

	for (const entity of system.entities()) {
		if (lineIntersectsEntity(start, end, entity)) {
			logger.debug(`Path: avoiding ${entity.entityType} ${entity.id} ("${entity.name}")`);
			intersector = entity;
			break;
		}
	}

	if (!intersector) {
		// Direct path available, return start and end points
		return [start, end];
	}

	// Get a side point to navigate around the entity

	const offsetDirection = intersector.absolutePosition.subtract(start).normalize();

	const sidePoint = new Vector3(-offsetDirection.z, 0, offsetDirection.x).scale(radius(intersector)).addInPlace(intersector.absolutePosition);

	return [start, ...findPath(sidePoint, end, system)];
}
