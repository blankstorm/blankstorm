import { config } from '../meta.js';
import CelestialBody from './CelestialBody.js';
import { Vector3 } from '../../../node_modules/@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '../../../node_modules/@babylonjs/core/Maths/math.color.js';
import { PointLight } from '../../../node_modules/@babylonjs/core/Lights/pointLight.js';
import { StandardMaterial } from '../../../node_modules/@babylonjs/core/Materials/standardMaterial.js';
import { CreateSphereVertexData } from '../../../node_modules/@babylonjs/core/Meshes/Builders/sphereBuilder.js';

export default class extends CelestialBody {
	constructor({ name, position = Vector3.Zero(), radius = 1, color = Color3.Gray(), scene, id }) {
		super(name ?? 'Unknown Star', id, scene);
		CreateSphereVertexData({ diameter: radius * 2, segments: config.mesh_segments }).applyToMesh(this);
		Object.assign(this, {
			position,
			light: Object.assign(new PointLight(this.id + '.light', position, scene), { intensity: 1, range: 10000 }),
			material: Object.assign(new StandardMaterial(this.id + '.mat', scene), {
				//emissiveTexture: new NoiseProceduralTexture(this.id + ".texture", config.mesh_segments, scene),
				emissiveColor: color,
				disableLighting: true,
			}),
			radius,
			color,
			isStar: true,
		});
		//Object.assign(s.material.emissiveTexture, {animationSpeedFactor: 0.1, octaves: 8, persistence:0.8});
		//s.material.Fragment_Before_FragColor(`color = vec4(vec3(color.xyz),1.0);`);
	}
}
