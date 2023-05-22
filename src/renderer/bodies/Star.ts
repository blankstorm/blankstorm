import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { PointLight } from '@babylonjs/core/Lights/pointLight';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CreateSphereVertexData } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Scene } from '@babylonjs/core/scene';

import config from '../config';
import type { SerializedStar } from '../../core';

export class StarRenderer extends Mesh {
	__material: StandardMaterial;
	radius: number;
	light: PointLight;
	constructor(id: string, scene: Scene) {
		super(id, scene);
		this.light = new PointLight(id + '.light', this.position, scene);
		Object.assign(this.light, config.star_light);
		this.__material = this.material = new StandardMaterial(id + '.mat', scene);
		this.__material.disableLighting = true;

		/*maybe in the future:
		this.__material.emissiveTexture = new NoiseProceduralTexture(id + ".texture", config.mesh_segments, scene);
		Object.assign(this.__material.emissiveTexture, {animationSpeedFactor: 0.1, octaves: 8, persistence:0.8});
		this.__material.Fragment_Before_FragColor(`color = vec4(vec3(color.xyz),1.0);`);
		*/
	}

	async update({ name, radius, color, position, rotation, parent }: SerializedStar) {
		this.name = name;
		if (this.radius != radius) {
			this.radius = radius;
			CreateSphereVertexData({ diameter: radius * 2, segments: config.mesh_segments }).applyToMesh(this);
		}
		this.__material.emissiveColor = Color3.FromArray(color);
		this.position = Vector3.FromArray(position);
		this.rotation = Vector3.FromArray(rotation);
		const _parent = this.getScene().getNodeById(parent);
		if (_parent != this.parent) {
			this.parent = _parent;
		}
	}

	static async FromData(data: SerializedStar, scene: Scene) {
		const star = new this(data.id, scene);
		await star.update(data);
		return star;
	}
}
