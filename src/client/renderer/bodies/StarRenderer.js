import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { PointLight } from '@babylonjs/core/Lights/pointLight.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { CreateSphereVertexData } from '@babylonjs/core/Meshes/Builders/sphereBuilder.js';
import { Mesh } from '@babylonjs/core/Meshes/mesh.js';

import config from '../config.js';

export default class StarRenderer extends Mesh {
	constructor({ position = Vector3.Zero(), rotation = Vector3.Zero(), radius = 1, color = Color3.Gray(), scene, id }) {
		super(id, scene);
		CreateSphereVertexData({ diameter: radius * 2, segments: config.mesh_segments }).applyToMesh(this);
		Object.assign(this, {
			position,
			rotation,
			light: Object.assign(new PointLight(id + '.light', position, scene), { intensity: 1, range: 10000 }),
			material: Object.assign(new StandardMaterial(id + '.mat', scene), {
				//emissiveTexture: new NoiseProceduralTexture(id + ".texture", config.mesh_segments, scene),
				emissiveColor: color,
				disableLighting: true,
			}),
		});
		//Object.assign(s.material.emissiveTexture, {animationSpeedFactor: 0.1, octaves: 8, persistence:0.8});
		//s.material.Fragment_Before_FragColor(`color = vec4(vec3(color.xyz),1.0);`);
	}

	static FromData(data, scene) {
		return new this({
			id: data.id,
			name: data.name,
			position: Vector3.FromArray(data.position),
			rotation: Vector3.FromArray(data.rotation),
			color: Color3.FromArray(data.color),
			radius: data.radius,
			scene,
		});
	}
}
