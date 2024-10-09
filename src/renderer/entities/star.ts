import { PointLight } from '@babylonjs/core/Lights/pointLight.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import type { StarJSON } from '../../core/entities/star.js';
import { config } from '../../core/metadata.js';
import { CelestialBodyRenderer } from './body.js';
import { renderers } from './entity.js';

export class StarRenderer extends CelestialBodyRenderer {
	public light: PointLight;
	public constructor(data: StarJSON) {
		super(data);
		this.light = new PointLight(data.id + ':light', this.position);
		this.light.range = config.region_size / 10;
		this.light.intensity = 1;

		const material = (this.mesh.material = new StandardMaterial(data.id + ':material'));
		material.disableLighting = true;
		material.emissiveColor = Color3.Black();
	}

	public update(data: StarJSON) {
		super.update(data);
		(this.mesh.material as StandardMaterial).emissiveColor.fromArray(data.color);
	}
}

renderers.set('Star', StarRenderer);
