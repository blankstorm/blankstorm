import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Level } from '../core/Level';
import type { SerializedLevel } from '../core/Level';
import { SerializedWaypoint, Waypoint } from './waypoint';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { SerializedCelestialBody } from '../core/nodes/CelestialBody';
import type { LevelEvent } from '../core/events';
import { getIconForNode } from './utils';

export interface SerializedClientLevel extends SerializedLevel {
	waypoints: SerializedWaypoint[];
	activePlayer: string;
}

export class ClientLevel extends Level {
	private _isActive = false;
	activePlayer: string;
	waypoints: Waypoint[] = [];

	get isActive() {
		return this._isActive;
	}

	set isActive(isActive: boolean) {
		this._isActive = isActive;
		this.emit('active', this.toJSON());
	}

	constructor(name: string) {
		super(name);

		this.addEventListener('body.created', (e: LevelEvent) => {
			const body = e.emitter as SerializedCelestialBody;
			const waypoint = new Waypoint(null, true, true, this);
			waypoint.name = body.name;
			waypoint.position = Vector3.FromArray(body.position);
			waypoint.color = Color3.FromHexString('#88ddff');
			waypoint.icon = getIconForNode(body);
		});
	}

	toJSON(): SerializedClientLevel {
		const data = Object.assign(super.toJSON(), {
			activePlayer: this.activePlayer,
			waypoints: this.waypoints.filter(wp => !wp.builtin).map(wp => wp.toJSON()),
		});
		data.nodes = data.nodes.filter(node => node.nodeType != 'waypoint');
		return data;
	}

	static FromJSON(data: SerializedClientLevel, level?: ClientLevel): ClientLevel {
		level ||= new ClientLevel(data.name);
		Level.FromJSON(data, level);
		for (const _waypoint of data.waypoints || []) {
			const waypoint = new Waypoint(_waypoint.id, _waypoint.readonly, false, level);
			waypoint.name = _waypoint.name;
			waypoint.color = Color3.FromArray(_waypoint.color);
			waypoint.position = Vector3.FromArray(_waypoint.position);
		}
		level.activePlayer = data.activePlayer;
		return level;
	}
}
