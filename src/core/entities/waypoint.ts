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

export class Waypoint extends Entity<{
	icon_change: [string];
	color_change: [string];
	name_change: [string];
}> {
	protected _color: string;
	protected _icon = 'location-dot';

	protected _active: boolean;

	public get active(): boolean {
		return this._active;
	}

	public readonly: boolean = false;

	public builtin: boolean = false;

	public get icon(): string {
		return this._icon;
	}

	public set icon(icon: string) {
		this._icon = icon;
		this.emit('icon_change', icon);
	}

	public get color(): string {
		return this._color;
	}

	public set color(color: string) {
		this._color = color;
		this.emit('color_change', color);
	}

	public override set name(name: string) {
		super.name = name;
		this.emit('name_change', name);
	}

	public toJSON(): WaypointJSON {
		return {
			...super.toJSON(),
			...pick(this, 'icon', 'color', 'readonly', 'builtin'),
			system: this.level.id,
		};
	}

	public fromJSON(data: Partial<WaypointJSON>): void {
		super.fromJSON(data);
		assignWithDefaults(this, pick(data, 'builtin', 'readonly', 'color'));
	}
}
