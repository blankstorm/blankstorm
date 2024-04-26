import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import type { StarJSON } from '../../core/entities/star';
import { CelestialBodyRenderer } from './body';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';
import { config } from '../../core/metadata';

export class StarRenderer extends CelestialBodyRenderer implements Renderer<StarJSON> {
	public light: PointLight;
	public constructor(id: string, scene: Scene) {
		super(id, scene);
		this.light = new PointLight(id + ':light', this.position, scene);
		Object.assign(this.light, {
			range: config.region_size / 10,
			intensity: 1,
		});
		const material = (this.material = new StandardMaterial(id + ':material', scene));
		material.disableLighting = true;
	}

	public async update(data: StarJSON) {
		await super.update(data);
		(<StandardMaterial>this.material).emissiveColor = Color3.FromArray(data.color);
	}
}

StarRenderer satisfies RendererStatic<StarRenderer>;
entityRenderers.set('Star', StarRenderer);
