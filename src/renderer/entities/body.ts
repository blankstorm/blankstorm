import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { CreateSphereVertexData } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { CelestialBodyJSON } from '../../core/entities/body';
import { EntityRenderer, renderers } from './entity';
import type { ProjectileMaterial } from './projectile';

export class CelestialBodyRenderer extends EntityRenderer<CelestialBodyJSON> {
	public radius = 0;
	public mesh: Mesh = new Mesh('CelestialBodyRenderer.mesh', null, this);

	public readonly projectileMaterials: ProjectileMaterial[] = [
		{
			applies_to: ['laser'],
			material: Object.assign(new StandardMaterial(''), { emissiveColor: Color3.Red() }),
		},
	];

	public update(data: CelestialBodyJSON) {
		super.update(data);
		if (this.radius != data.radius) {
			this.radius = data.radius;
			CreateSphereVertexData({ diameter: data.radius * 2, segments: 64 }).applyToMesh(this.mesh);
		}
	}
}

renderers.set('CelestialBody', CelestialBodyRenderer);
