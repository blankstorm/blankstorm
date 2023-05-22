import HardpointRenderer from './HardpointRenderer';
import ModelRenderer from '../ModelRenderer';
import Ship from '../../../core/entities/Ship';

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
		for (const hardpointData of [...hardpoints]) {
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
