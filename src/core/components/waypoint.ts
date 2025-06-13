import { Component, registerComponent } from 'deltablank/core/component.js';
import type { EntityJSON } from 'deltablank/core/entity.js';
import { assignWithDefaults, pick } from 'utilium';

export interface WaypointData {
	color: string;
	icon: string;
	readonly: boolean;
	builtin: boolean;
}

@registerComponent
export class Waypoint
	extends Component<{ waypoint: Waypoint }, { waypoint: WaypointData }, { waypoint: Partial<WaypointData> }>
	implements WaypointData
{
	public color!: string;
	public icon = 'location-dot';

	protected _active: boolean = false;

	public get active(): boolean {
		return this._active;
	}

	public readonly: boolean = false;

	public readonly isObstacle = false;

	public builtin: boolean = false;

	public setup(): { waypoint: Waypoint } {
		assignWithDefaults(this as WaypointData, this.entity.constructor.config.waypoint || {});
		return { waypoint: this };
	}

	public toJSON(): { waypoint: WaypointData } {
		return {
			waypoint: pick(this, 'icon', 'color', 'readonly', 'builtin'),
		};
	}

	public load(this: Waypoint, data: EntityJSON & { waypoint: WaypointData }): void {
		assignWithDefaults(this, pick(data.waypoint, 'icon', 'color', 'builtin', 'readonly'));
	}
}
