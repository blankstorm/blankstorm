import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import type { CelestialBodyJSON } from './body.js';
import { CelestialBody } from './body.js';

export interface StarJSON extends CelestialBodyJSON {
	color: number[];
}

export class Star extends CelestialBody {
	public color: Color3 = Color3.Black();

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
