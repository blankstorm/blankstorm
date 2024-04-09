import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';
import type { PlayerJSON } from '../../core/entities/player';
import type { CustomHardpointProjectileMaterial } from './Hardpoint';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';

export class PlayerRenderer extends TransformNode implements Renderer<PlayerJSON> {
	velocity = Vector3.Zero();
	customHardpointProjectileMaterials: CustomHardpointProjectileMaterial[];
	constructor(id: string, scene: Scene) {
		super(id, scene);
		this.customHardpointProjectileMaterials = [
			{
				applies_to: ['laser'],
				material: Object.assign(new StandardMaterial('player-laser-projectile-material', scene), {
					emissiveColor: Color3.Teal(),
					albedoColor: Color3.Teal(),
				}),
			},
		];
	}

	async update({ name, position, rotation, velocity, parent }: PlayerJSON) {
		this.name = name;
		this.position = Vector3.FromArray(position);
		this.rotation = Vector3.FromArray(rotation);
		this.velocity = Vector3.FromArray(velocity);
		const _parent = this.getScene().getNodeById(parent);
		if (_parent != this.parent) {
			this.parent = _parent;
		}
	}
}
PlayerRenderer satisfies RendererStatic<PlayerRenderer>;
entityRenderers.set('Player', PlayerRenderer);
