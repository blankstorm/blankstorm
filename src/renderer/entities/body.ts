import { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { Node } from '@babylonjs/core/node';
import type { Scene } from '@babylonjs/core/scene';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { CreateSphereVertexData } from '@babylonjs/core/Meshes/Builders/sphereBuilder';
import type { CelestialBodyJSON } from '../../core/entities/body';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';

export class CelestialBodyRenderer extends Mesh implements Renderer<CelestialBodyJSON> {
	public radius = 0;
	public fleetPosition = Vector3.Zero();

	// note: using ...args: ConstructorParmeters<Mesh> doesn't work since Mesh is imported as an interface, namespace, and class
	public constructor(name: string, scene?: Scene, parent?: Node, source?: Mesh, doNotCloneChildren?: boolean, clonePhysicsImpostor?: boolean) {
		super(name, scene, parent, source, doNotCloneChildren, clonePhysicsImpostor);
	}

	public async update({ name, radius, position, rotation, parent, fleet }: CelestialBodyJSON) {
		this.name = name;
		if (this.radius != radius) {
			this.radius = radius;
			CreateSphereVertexData({ diameter: radius * 2, segments: 32 }).applyToMesh(this);
		}
		this.position = Vector3.FromArray(position);
		this.rotation = Vector3.FromArray(rotation);
		this.fleetPosition = Vector3.FromArray(fleet?.position);
		this.parent = this.getScene().getNodeById(parent);
	}
}
CelestialBodyRenderer satisfies RendererStatic<CelestialBodyRenderer>;
entityRenderers.set('CelestialBody', CelestialBodyRenderer);
