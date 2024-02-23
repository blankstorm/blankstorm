import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Node } from '@babylonjs/core/node';
import type { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreateSphereVertexData } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import type { SerializedCelestialBody } from '../../core';
import config from '../config';
import type { Renderer, RendererStatic } from './Renderer';

export class CelestialBodyRenderer extends Mesh implements Renderer<SerializedCelestialBody> {
	radius = 0;
	// note: using ...args: ConstructorParmeters<Mesh> doesn't work since Mesh is imported as an interface, namespace, and class
	constructor(name: string, scene?: Scene, parent?: Node, source?: Mesh, doNotCloneChildren?: boolean, clonePhysicsImpostor?: boolean) {
		super(name, scene, parent, source, doNotCloneChildren, clonePhysicsImpostor);
	}

	async update({ name, radius, position, rotation, parent }: SerializedCelestialBody) {
		this.name = name;
		if (this.radius != radius) {
			this.radius = radius;
			CreateSphereVertexData({ diameter: radius * 2, segments: config.mesh_segments }).applyToMesh(this);
		}
		this.position = Vector3.FromArray(position);
		this.rotation = Vector3.FromArray(rotation);
		const _parent = this.getScene().getNodeById(parent);
		if (_parent != this.parent) {
			this.parent = _parent;
		}
	}

	static async FromJSON(data: SerializedCelestialBody, scene: Scene) {
		const star = new this(data.id, scene);
		await star.update(data);
		return star;
	}
}
CelestialBodyRenderer satisfies RendererStatic<SerializedCelestialBody>;
