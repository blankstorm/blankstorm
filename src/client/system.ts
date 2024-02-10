import { Color3 } from '@babylonjs/core/Maths/math.color';
import { System } from '../core/System';
import type { SerializedSystem } from '../core/System';
import { SerializedWaypoint, Waypoint } from './waypoint';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { SerializedCelestialBody } from '../core/nodes/CelestialBody';
import { getIconForNode } from './utils';
import type { ClientLevel } from './level';

export interface SerializedClientSystem extends SerializedSystem {
	waypoints: SerializedWaypoint[];
}

export class ClientSystem extends System {
	waypoints: Waypoint[] = [];

	declare level: ClientLevel;
	constructor(id: string, level: ClientLevel) {
		super(id, level);

		this.on('body.created', (body: SerializedCelestialBody) => {
			const waypoint = new Waypoint(null, true, true, this);
			waypoint.name = body.name;
			waypoint.position = Vector3.FromArray(body.position);
			waypoint.color = Color3.FromHexString('#88ddff');
			waypoint.icon = getIconForNode(body);
		});
	}

	toJSON(): SerializedClientSystem {
		const data = Object.assign(super.toJSON(), {
			waypoints: this.waypoints.filter(wp => !wp.builtin).map(wp => wp.toJSON()),
		});
		data.nodes = data.nodes.filter(node => node.nodeType != 'waypoint');
		return data;
	}

	static FromJSON(data: SerializedClientSystem, level?: ClientLevel): ClientSystem {
		const system = new ClientSystem(data.id, level);
		System.FromJSON(data, level, system);
		for (const _waypoint of data.waypoints || []) {
			const waypoint = new Waypoint(_waypoint.id, _waypoint.readonly, false, system);
			waypoint.name = _waypoint.name;
			waypoint.color = Color3.FromArray(_waypoint.color);
			waypoint.position = Vector3.FromArray(_waypoint.position);
		}
		return system;
	}
}
