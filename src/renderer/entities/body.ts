import { CreateSphereVertexData } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { CelestialBodyJSON } from '~/core/entities/body';
import { EntityRenderer, renderers, type Renderer } from './entity';

export class CelestialBodyRenderer extends EntityRenderer implements Renderer<CelestialBodyJSON> {
	public radius = 0;
	public mesh: Mesh = new Mesh('CelestialBodyRenderer:mesh', null, this);

	public async update(data: CelestialBodyJSON) {
		await super.update(data);
		if (this.radius != data.radius) {
			this.radius = data.radius;
			CreateSphereVertexData({ diameter: data.radius * 2, segments: 64 }).applyToMesh(this.mesh);
		}
	}
}

renderers.set('CelestialBody', CelestialBodyRenderer);
