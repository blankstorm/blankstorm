import { Color3 } from '@babylonjs/core/Maths/math.color';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Scene } from '@babylonjs/core/scene';

import config from '../config';
import type { SerializedStar } from '../../core';
import { CelestialBodyRenderer } from './CelestialBody';
import type { Renderer } from './Renderer';

export class StarRenderer extends CelestialBodyRenderer implements Renderer<SerializedStar> {
	__material: StandardMaterial;
	light: PointLight;
	constructor(id: string, scene: Scene) {
		super(id, scene);
		this.light = new PointLight(id + '.light', this.position, scene);
		Object.assign(this.light, config.star_light);
		this.__material = this.material = new StandardMaterial(id + '.mat', scene);
		this.__material.disableLighting = true;

		/*maybe in the future:
		this.__material.emissiveTexture = new NoiseProceduralTexture(id + ".texture", config.mesh_segments, scene);
		Object.assign(this.__material.emissiveTexture, {animationSpeedFactor: 0.1, octaves: 8, persistence:0.8});
		this.__material.Fragment_Before_FragColor(`color = vec4(vec3(color.xyz),1.0);`);
		*/
	}

	async update(data: SerializedStar) {
		await super.update(data);
		this.__material.emissiveColor = Color3.FromArray(data.color);
	}

	static async FromData(data: SerializedStar, scene: Scene) {
		const star = new this(data.id, scene);
		await star.update(data);
		return star;
	}
}
