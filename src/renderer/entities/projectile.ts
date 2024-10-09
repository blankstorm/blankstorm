import type { Material } from '@babylonjs/core/Materials/material.js';
import type { Mesh } from '@babylonjs/core/Meshes/mesh.js';
import type { ProjectileJSON, ProjectileType } from '../../core/entities/projectile.js';
import { ModelRenderer } from '../models.js';
import type { CelestialBodyRenderer } from './body.js';
import { renderers } from './entity.js';
import type { HardpointRenderer } from './hardpoint.js';
import type { PlayerRenderer } from './player.js';

export interface ProjectileMaterial {
	applies_to: ProjectileType[];
	material: Material;
}

export class ProjectileRenderer extends ModelRenderer<ProjectileJSON> {
	public hardpoint: HardpointRenderer;
	public owner: CelestialBodyRenderer | PlayerRenderer;

	public constructor(data: ProjectileJSON) {
		super(data);
		this.hardpoint = this.getScene().getNodeById(this.data.hardpoint) as HardpointRenderer;
		this.owner = this.getScene().getNodeById(this.hardpoint.data.owner!) as CelestialBodyRenderer | PlayerRenderer;
		const material = this.owner.projectileMaterials.find(({ applies_to, material }) => applies_to.includes(this.data.type) && material)?.material ?? null;
		for (const mesh of this.getChildMeshes<Mesh>()) {
			mesh.material = material;
		}
		//projectiles[this.generic.projectileType].call(this, target, material);
	}
}
renderers.set('Projectile', ProjectileRenderer);
