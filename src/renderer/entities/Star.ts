import { Color3 } from '@babylonjs/core/Maths/math.color';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { Scene } from '@babylonjs/core/scene';

import config from '../config';
import type { StarJSON } from '../../core';
import { CelestialBodyRenderer } from './CelestialBody';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';

export class StarRenderer extends CelestialBodyRenderer implements Renderer<StarJSON> {
	light: PointLight;
	//get material(): StandardMaterial { return super.material as StandardMaterial }
	constructor(id: string, scene: Scene) {
		super(id, scene);
		this.light = new PointLight(id + '.light', this.position, scene);
		Object.assign(this.light, config.star_light);
		const material = (this.material = new StandardMaterial(id + '.mat', scene));
		material.disableLighting = true;

		/*maybe in the future:
		material.emissiveTexture = new NoiseProceduralTexture(id + ".texture", config.mesh_segments, scene);
		Object.assign(material.emissiveTexture, {animationSpeedFactor: 0.1, octaves: 8, persistence:0.8});
		material.Fragment_Before_FragColor(`color = vec4(vec3(color.xyz),1.0);`);
		*/
	}

	async update(data: StarJSON) {
		await super.update(data);
		(<StandardMaterial>this.material).emissiveColor = Color3.FromArray(data.color);
	}
}

StarRenderer satisfies RendererStatic<StarRenderer>;
entityRenderers.set('Star', StarRenderer);
