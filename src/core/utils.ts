import { Vector3 } from '@babylonjs/core/Maths/math.vector';

export function randomCords(dis = 1, y0?: boolean): Vector3 {
	const angle = Math.random() * Math.PI * 2,
		angle2 = Math.random() * Math.PI * 2;

	const x = dis * Math.cos(angle),
		y = y0 ? 0 : dis * Math.sin(angle) * Math.cos(angle2),
		z = dis * Math.sin(angle) * (y0 ? 1 : Math.sin(angle2));
	return new Vector3(x, y, z);
}

export function xpToLevel(xp: number) {
	return Math.sqrt(xp / 10);
}

export function levelToXp(level: number) {
	return 10 * level ** 2;
}
