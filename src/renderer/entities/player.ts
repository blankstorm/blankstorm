import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';
import type { PlayerJSON } from '../../core/entities/player';
import type { CustomHardpointProjectileMaterial } from './hardpoint';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';

export class PlayerRenderer extends TransformNode implements Renderer<PlayerJSON> {
	velocity: Vector3 = Vector3.Zero();
	fleetPosition: Vector3 = Vector3.Zero();
	customHardpointProjectileMaterials: CustomHardpointProjectileMaterial[] = [
		{
			applies_to: ['laser'],
			material: Object.assign(new StandardMaterial('player-laser-projectile'), {
				emissiveColor: Color3.Teal(),
				albedoColor: Color3.Teal(),
			}),
		},
	];
	constructor(id: string, scene: Scene) {
		super(id, scene);
	}

	async update({ name, position, rotation, velocity, parent, fleet }: PlayerJSON) {
		this.name = name;
		this.position = Vector3.FromArray(position);
		this.rotation = Vector3.FromArray(rotation);
		this.velocity = Vector3.FromArray(velocity);
		this.fleetPosition = Vector3.FromArray(fleet?.position);
		for (const id of fleet?.ships || []) {
			const ship = this.getScene().getNodeById(id);
			ship.parent = this;
		}
		this.parent = this.getScene().getNodeById(parent);
	}
}
PlayerRenderer satisfies RendererStatic<PlayerRenderer>;
entityRenderers.set('Player', PlayerRenderer);
