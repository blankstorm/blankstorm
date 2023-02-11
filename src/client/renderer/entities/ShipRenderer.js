import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';

import HardpointRenderer from './HardpointRenderer.js';
import ModelRenderer from '../ModelRenderer.js';
import { hl } from '../index.js';

export default class ShipRenderer extends ModelRenderer {
	hardpoints = new Map();
	#selected = false;
	constructor(id, scene) {
		super(id, scene);
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

	async update({ name, position, rotation, hardpoints = [], type } = {}) {
		await super.update({ name, position, rotation, type });
		for (let hardpointData of [...hardpoints]) {
			if (this.hardpoints.has(hardpointData.id)) {
				this.hardpoints.get(hardpointData.id).update(hardpointData);
			} else {
				const hardpoint = await HardpointRenderer.FromData(hardpointData, this.getScene());
				hardpoint.parent = this;
				this.hardpoints.set(hardpoint.id, hardpoint);
			}
		}
	}

	static async FromData(data, scene) {
		const ship = new this(data.id, scene);
		await ship.update(data);
		return ship;
	}
}
