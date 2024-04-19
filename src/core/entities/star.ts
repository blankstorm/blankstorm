import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Level } from '../level';
import type { CelestialBodyJSON } from './body';
import { CelestialBody } from './body';

export interface StarJSON extends CelestialBodyJSON {
	color: number[];
}

export class Star extends CelestialBody {
	public color: Color3;
	public constructor(id: string, level: Level, options?) {
		super(id, level, options);
	}

	public toJSON(): StarJSON {
		return {
			...super.toJSON(),
			color: this.color.asArray(),
		};
	}

	public fromJSON(data: Partial<StarJSON>): void {
		super.fromJSON(data);
		this.color = Color3.FromArray(data.color || this.color?.asArray());
	}
}
