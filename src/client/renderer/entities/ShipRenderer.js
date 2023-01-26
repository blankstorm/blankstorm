import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import HardpointRenderer from './HardpointRenderer.js';
import ModelRenderer from '../ModelRenderer.js';

export default class ShipRenderer extends ModelRenderer {
	hardpoints = [];
	constructor({ id, name, position, rotation, scene, hardpoints, type, }) {
		super({ id, name, position, rotation, scene });

		this.createInstance(type);

		for(let hardpointData of hardpoints){
			let hardpoint;
			if(hardpointData instanceof HardpointRenderer){
				hardpoint = hardpointData;
			}else{
				hardpoint = HardpointRenderer.FromData(hardpointData, scene);
			}
			
			this.hardpoints.push(hardpoint);
			hardpoint.parent = this;

		}
	}

	static FromData(data, scene) {
		return new this({
			id: data.id,
			position: Vector3.FromArray(data.position),
			rotation: Vector3.FromArray(data.rotation),
			scene,
			type: data.class,
			hardpoints: data.hardpoints,
		});
	}
}