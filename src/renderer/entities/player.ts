import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { EntityRenderer, renderers } from './entity.js';
import type { ProjectileMaterial } from './projectile.js';

export class PlayerRenderer extends EntityRenderer {
	public readonly projectileMaterials: ProjectileMaterial[] = [
		{
			applies_to: ['laser'],
			material: Object.assign(new StandardMaterial(''), { emissiveColor: Color3.Teal(), albedoColor: Color3.Teal() }),
		},
	];
}
renderers.set('Player', PlayerRenderer);
