import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';

export default class PlayerRenderer extends TransformNode {
	velocity = Vector3.Zero();

	constructor(id, scene) {
		super(id, scene);
	}

	async update({ name, position, rotation, velocity, parent } = {}){
		this.name = name;
		this.position = Vector3.FromArray(position);
		this.rotation = Vector3.FromArray(rotation);
		this.velocity = Vector3.FromArray(velocity);
		const _parent = this.getScene().getNodeById(parent);
		if(_parent != this.parent){
			this.parent = _parent;
		}
	}

	static async FromData(data, scene) {
		const player = new this(data.id, scene);
		await player.update(data);
		return player;
	}
}
