import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Logger } from 'logzen';
import type { EntityJSON } from './entities/entity';

export const logger = new Logger({ noGlobalConsole: true, hideWarningStack: true });

export function randomInCircle(dis = 1): Vector2 {
	const angle = Math.random() * Math.PI * 2;

	return new Vector2(Math.cos(angle), Math.sin(angle)).scaleInPlace(dis);
}

export function randomInSphere(dis = 1, y0?: boolean): Vector3 {
	const angle = Math.random() * Math.PI * 2,
		angle2 = Math.random() * Math.PI * 2;

	return new Vector3(dis * Math.cos(angle), y0 ? 0 : dis * Math.sin(angle) * Math.cos(angle2), dis * Math.sin(angle) * (y0 ? 1 : Math.sin(angle2)));
}

export function xpToLevel(xp: number) {
	return Math.sqrt(xp / 10);
}

export function levelToXp(level: number) {
	return 10 * level ** 2;
}

export function getEntityIcon(entity: EntityJSON): string {
	switch (entity.entityType) {
		case 'Planet':
			return 'earth-americas';
		case 'Star':
			return 'sun-bright';
		case 'Ship':
			return 'triangle';
		default:
			return 'planet-ringed';
	}
}
