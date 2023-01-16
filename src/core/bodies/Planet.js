import CelestialBody from './CelestialBody.js';

export default class Planet extends CelestialBody {
	constructor({ id, name, position, rotation, biome = 'earthlike', radius = 1, owner = null, fleet = [], rewards = {}, level }) {
		super(id, {name: name ?? 'Unknown Planet', position, rotation, owner, radius, fleet, rewards }, level);
		
		this.biome = biome;
	}
	
}