import { assignWithDefaults, pick } from 'utilium';
import type { EntityJSON } from './entity';
import { Entity } from './entity';

export interface WaypointJSON extends EntityJSON {
	color: string;
	icon: string;
	readonly: boolean;
	builtin: boolean;
	system: string;
}

export class Waypoint extends Entity {
	public color!: string;
	public icon = 'location-dot';

	protected _active: boolean = false;

	public get active(): boolean {
		return this._active;
	}

	public readonly: boolean = false;

	public builtin: boolean = false;

	public toJSON(): WaypointJSON {
		return {
			...super.toJSON(),
			...pick(this, 'icon', 'color', 'readonly', 'builtin'),
			system: this.level.id,
		};
	}

	public fromJSON(data: Partial<WaypointJSON>): void {
		super.fromJSON(data);
		assignWithDefaults(this as Waypoint, pick(data, 'icon', 'color', 'builtin', 'readonly'));
	}
}
