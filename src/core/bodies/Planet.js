import CelestialBody from './CelestialBody.js';

export default class Planet extends CelestialBody {
	constructor(id, level, options) {
		super(id, level, options);
	}

	serialize() {
		return Object.assign(super.serialize(), {
			biome: this.biome,
		});
	}

	static FromData(data, level) {
		const planet = super.FromData(data, level, data);
		planet.biome = data.biome;
		return planet;
	}
}
