import HardpointRenderer from './HardpointRenderer.js';
import ModelRenderer from '../ModelRenderer.js';
import Ship from '../../../core/entities/Ship.js';

export default class ShipRenderer extends ModelRenderer {
	hardpoints = new Map();
	constructor(id, scene) {
		super(id, scene);
	}

	get generic() {
		return Ship.generic.get(this.type);
	}

	async update({ name, position, rotation, hardpoints = [], type, parent } = {}) {
		await super.update({ name, position, rotation, type, parent });
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
