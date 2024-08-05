import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { EntityRenderer, renderers } from './entity';
import type { ProjectileMaterial } from './projectile';

export class PlayerRenderer extends EntityRenderer {
	public readonly projectileMaterials: ProjectileMaterial[] = [
		{
			applies_to: ['laser'],
			material: Object.assign(new StandardMaterial(''), { emissiveColor: Color3.Teal(), albedoColor: Color3.Teal() }),
		},
	];
}
renderers.set('Player', PlayerRenderer);
