import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';

export default class PlayerRenderer extends TransformNode {
	velocity = Vector3.Zero();

	constructor(id, scene) {
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

	async update({ name, position, rotation, velocity, parent } = {}) {
		this.name = name;
		this.position = Vector3.FromArray(position);
		this.rotation = Vector3.FromArray(rotation);
		this.velocity = Vector3.FromArray(velocity);
		const _parent = this.getScene().getNodeById(parent);
		if (_parent != this.parent) {
			this.parent = _parent;
		}
	}

	static async FromData(data, scene) {
		const player = new this(data.id, scene);
		await player.update(data);
		return player;
	}
}
