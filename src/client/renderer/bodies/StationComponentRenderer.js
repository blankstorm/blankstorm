import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import ModelRenderer from '../ModelRenderer';

export default class StationComponentRenderer extends ModelRenderer {
	constructor({ id, scene }) {
		super({ id, scene });
	}

	static FromData(data, scene) {
		return new this({
			id: data.id,
			position: Vector3.FromArray(data.position),
			rotation: Vector3.FromArray(data.rotation),
			scene,
		});
	}
}
