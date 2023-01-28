import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';

import HardpointRenderer from './HardpointRenderer.js';
import ModelRenderer from '../ModelRenderer.js';
import { hl } from '../index.js';

export default class ShipRenderer extends ModelRenderer {
	hardpoints = [];
	#selected = false;
	constructor({ id, name, position, rotation, scene, hardpoints, type }) {
		super({ id, name, position, rotation, scene });

		this.createInstance(type);

		for (let hardpointData of hardpoints) {
			let hardpoint;
			if (hardpointData instanceof HardpointRenderer) {
				hardpoint = hardpointData;
			} else {
				hardpoint = HardpointRenderer.FromData(hardpointData, scene);
			}

			this.hardpoints.push(hardpoint);
			hardpoint.parent = this;
		}
	}

	select() {
		if (!this.isInstanciated) {
			throw new ReferenceError('Cannot select a renderer that was not been instantiated');
		}
		[this.instance, ...this.hardpoints.map(hp => hp.instance)].forEach(mesh => {
			mesh.getChildMeshes().forEach(child => {
				hl.addMesh(child, Color3.Green());
			});
		});
		this.#selected = true;
	}

	unselect() {
		if (!this.isInstanciated) {
			throw new ReferenceError('Cannot unselect a renderer that was not been instantiated');
		}
		[this.instance, ...this.hardpoints.map(hp => hp.instance)].forEach(mesh => {
			mesh.getChildMeshes().forEach(child => {
				hl.removeMesh(child);
			});
		});
		this.#selected = false;
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
