import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Level } from '../core/Level';
import type { SerializedLevel } from '../core/Level';
import { SerializedWaypoint, Waypoint } from './waypoint';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { SerializedCelestialBody } from '../core/bodies/CelestialBody';
import type { LevelEvent } from '../core/events';

export interface SerializedClientLevel extends SerializedLevel {
	waypoints: SerializedWaypoint[];
}

export class ClientLevel extends Level {
	isActive = false;
	waypoints: Waypoint[] = [];
	constructor(name: string) {
		super(name);

		this.addEventListener('body.created', (e: LevelEvent) => {
			const body = e.emitter as SerializedCelestialBody;
			const waypoint = new Waypoint(null, true, true, this);
			waypoint.name = body.name;
			waypoint.position = Vector3.FromArray(body.position);
			waypoint.color = Color3.FromHexString('#88ddff');
			waypoint.icon = Waypoint.GetIconForCelestialBody(body);
		});
	}

	serialize(): SerializedClientLevel {
		return Object.assign(super.serialize(), {
			waypoints: this.waypoints.filter(wp => !wp.builtin).map(wp => wp.serialize()),
		});
	}

	static FromData(data: SerializedClientLevel, level?: ClientLevel): ClientLevel {
		level ||= new ClientLevel(data.name);
		Level.FromData(data, level);
		for (const _waypoint of data.waypoints || []) {
			const waypoint = new Waypoint(_waypoint.id, _waypoint.readonly, false, level);
			waypoint.name = _waypoint.name;
			waypoint.color = Color3.FromArray(_waypoint.color);
			waypoint.position = Vector3.FromArray(_waypoint.position);
		}
		return level;
	}
}
