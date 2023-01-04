import { config } from '../meta.js';
import { random } from '../utils.js';
import Ship from '../entities/Ship.js';
import CelestialBody from './CelestialBody.js';
import CelestialBodyMaterial from './CelestialBodyMaterial.js';

import { Vector2, Vector3 } from '../../../node_modules/@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '../../../node_modules/@babylonjs/core/Maths/math.color.js';
import { StandardMaterial } from '../../../node_modules/@babylonjs/core/Materials/standardMaterial.js';
import { CreateSphereVertexData } from '../../../node_modules/@babylonjs/core/Meshes/Builders/sphereBuilder.js';

const Planet = class extends CelestialBody {
	constructor({ name, position = Vector3.Zero(), biome = 'earthlike', radius = 1, owner = null, fleet = [], rewards = {}, scene, id }) {
		super(name ?? 'Unknown Planet', id, scene);
		CreateSphereVertexData({ diameter: radius * 2, segments: config.mesh_segments }).applyToMesh(this);
		Object.assign(this, {
			owner,
			radius,
			rewards,
			biome,
			position,
			material: Planet.biomes.has(biome) ? new CelestialBodyMaterial(Planet.biomes.get(biome), scene) : new StandardMaterial('mat', scene),
		});
		this.fleetLocation = random.cords(random.int(radius + 5, radius * 1.2), true);
		for (let shipOrType of fleet) {
			if (shipOrType instanceof Ship) {
				this.fleet.push(shipOrType);
			} else {
				let ship = new Ship(shipOrType, this, scene);
				ship.position.addInPlace(this.fleetLocation);
			}
		}
		this._customHardpointProjectileMaterials = [
			{
				applies_to: ['laser'],
				material: Object.assign(new StandardMaterial('player-laser-projectile-material', scene), { emissiveColor: Color3.Red() }),
			},
		];
	}

	static biomes = new Map([
		[
			'earthlike',
			{
				clouds: false, //true,
				upperColor: new Color3(0.2, 2.0, 0.2),
				lowerColor: new Color3(0, 0.2, 1.0),
				haloColor: new Color3(0, 0.2, 1.0),
				seed: 0.3,
				cloudSeed: 0.6,
				lowerClamp: new Vector2(0.6, 1),
				groundAlbedo: 1.25,
				cloudAlbedo: 0,
				directNoise: false,
				lowerClip: new Vector2(0, 0),
				range: new Vector2(0.3, 0.35),
				icon: 'earth-americas',
			},
		],
		[
			'volcanic',
			{
				upperColor: new Color3(0.9, 0.45, 0.45),
				lowerColor: new Color3(1.0, 0, 0),
				haloColor: new Color3(1.0, 0, 0.3),
				seed: 0.3,
				cloudSeed: 0.6,
				clouds: false,
				lowerClamp: new Vector2(0, 1),
				maxResolution: 256,
				cloudAlbedo: 0,
				groundAlbedo: 1.0,
				directNoise: false,
				lowerClip: new Vector2(0, 0),
				range: new Vector2(0.3, 0.4),
				icon: 'planet-ringed',
			},
		],
		[
			'jungle',
			{
				upperColor: new Color3(0.1, 0.3, 0.7),
				lowerColor: new Color3(0, 1.0, 0.1),
				haloColor: new Color3(0.5, 1.0, 0.5),
				seed: 0.4,
				cloudSeed: 0.7,
				clouds: false, //true,
				lowerClamp: new Vector2(0, 1),
				maxResolution: 512,
				cloudAlbedo: 1.0,
				groundAlbedo: 1.1,
				directNoise: false,
				lowerClip: new Vector2(0, 0),
				range: new Vector2(0.2, 0.4),
				icon: 'earth-americas',
			},
		],
		[
			'ice',
			{
				upperColor: new Color3(1.0, 1.0, 1.0),
				lowerColor: new Color3(0.7, 0.7, 0.9),
				haloColor: new Color3(1.0, 1.0, 1.0),
				seed: 0.8,
				cloudSeed: 0.4,
				clouds: false, //true,
				lowerClamp: new Vector2(0, 1),
				maxResolution: 256,
				cloudAlbedo: 1.0,
				groundAlbedo: 1.1,
				directNoise: false,
				lowerClip: new Vector2(0, 0),
				range: new Vector2(0.3, 0.4),
				icon: 'planet-ringed',
			},
		],
		[
			'desert',
			{
				upperColor: new Color3(0.9, 0.3, 0),
				lowerColor: new Color3(1.0, 0.5, 0.1),
				haloColor: new Color3(1.0, 0.5, 0.1),
				seed: 0.18,
				cloudSeed: 0.6,
				clouds: false,
				lowerClamp: new Vector2(0.3, 1),
				maxResolution: 512,
				cloudAlbedo: 1.0,
				groundAlbedo: 1.0,
				directNoise: false,
				lowerClip: new Vector2(0, 0),
				range: new Vector2(0.3, 0.4),
				icon: 'planet-ringed',
			},
		],
		[
			'islands',
			{
				upperColor: new Color3(0.4, 2.0, 0.4),
				lowerColor: new Color3(0, 0.2, 2.0),
				haloColor: new Color3(0, 0.2, 2.0),
				seed: 0.15,
				cloudSeed: 0.6,
				clouds: false, //true,
				lowerClamp: new Vector2(0.6, 1),
				maxResolution: 512,
				cloudAlbedo: 1.0,
				groundAlbedo: 1.2,
				directNoise: false,
				lowerClip: new Vector2(0, 0),
				range: new Vector2(0.2, 0.3),
				icon: 'earty-oceania',
			},
		],
		[
			'moon',
			{
				upperColor: new Color3(2.0, 1.0, 0),
				lowerColor: new Color3(0, 0.2, 1.0),
				cloudSeed: 0.6,
				lowerClamp: new Vector2(0.6, 1),
				cloudAlbedo: 0.9,
				range: new Vector2(0.3, 0.35),
				haloColor: new Color3(0, 0, 0),
				seed: 0.5,
				clouds: false,
				groundAlbedo: 0.7,
				directNoise: true,
				lowerClip: new Vector2(0.5, 0.9),
				icon: 'planet-ringed',
			},
		],
	]);
};

export default Planet;
