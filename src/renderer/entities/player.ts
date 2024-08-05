import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { PlayerJSON } from '~/core/entities/player';
import { EntityRenderer, renderers, type Renderer } from './entity';
import type { ProjectileMaterial } from './hardpoint';

export class PlayerRenderer extends EntityRenderer implements Renderer<PlayerJSON> {
	public projectileMaterials: ProjectileMaterial[] = [
		{
			applies_to: ['laser'],
			material: Object.assign(new StandardMaterial('player-laser-projectile'), {
				emissiveColor: Color3.Teal(),
				albedoColor: Color3.Teal(),
			}),
		},
	];
}
renderers.set('Player', PlayerRenderer);
