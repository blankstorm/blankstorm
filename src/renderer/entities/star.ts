import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { Scene } from '@babylonjs/core/scene';
import type { StarJSON } from '../../core/entities/star';
import { config } from '../../core/metadata';
import { CelestialBodyRenderer } from './body';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';

export class StarRenderer extends CelestialBodyRenderer implements Renderer<StarJSON> {
	public light: PointLight;
	public constructor(id: string, scene: Scene) {
		super(id, scene);
		this.light = new PointLight(id + ':light', this.position, scene);
		this.light.range = config.region_size / 10;
		this.light.intensity = 1;

		const material = (this.mesh.material = new StandardMaterial(id + ':material', scene));
		material.disableLighting = true;
		material.emissiveColor = Color3.Black();
	}

	public async update(data: StarJSON) {
		await super.update(data);
		(<StandardMaterial>this.mesh.material).emissiveColor.fromArray(data.color);
	}
}

StarRenderer satisfies RendererStatic<StarRenderer>;
entityRenderers.set('Star', StarRenderer);
