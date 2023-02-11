import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import ModelRenderer from '../ModelRenderer';

export default class StationComponentRenderer extends ModelRenderer {
	constructor(id, scene) {
		super(id, scene);
	}

	async update({ name, position, rotation } = {}){
		this.name = name;
		this.position = Vector3.FromArray(position);
		this.rotation = Vector3.FromArray(rotation);
	}

	static async FromData(data, scene) {
		const component = new this(data.id, scene);
		await component.update(data);
		return component;
	}
}
