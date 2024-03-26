import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Animation } from '@babylonjs/core/Animations/animation';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { Scene } from '@babylonjs/core/scene';
import type { AssetContainer } from '@babylonjs/core/assetContainer';
import type { LinesMesh } from '@babylonjs/core/Meshes/linesMesh';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';

import '@babylonjs/loaders/glTF/index';

import config from './config';
import * as settings from '../client/settings';
import { random } from '../core/utils';
import type { SerializedEntity } from '../core/nodes/Node';

/**
 * Internal class for rendering models. Other renderers (e.g. ShipRenderer) use this.
 */
export class ModelRenderer extends TransformNode {
	#instance: TransformNode;
	#selected = false;
	#currentPath;
	#createdInstance = false;
	#pathGizmo?: LinesMesh;
	rendererType: RendererType;

	get generic(): { speed: number; agility: number } | undefined {
		console.warn(`Accessed generic of a ModelRenderer that was not a ShipRenderer`);
		return { speed: 0, agility: 0 };
	}

	constructor(id: string, scene: Scene) {
		super(id, scene);
	}

	get selected() {
		return this.#selected;
	}

	select() {
		if (!this.isInstanciated) {
			throw new ReferenceError('Cannot select a renderer that was not been instantiated');
		}
		for (const mesh of this.getChildMeshes()) {
			this.getScene()
				.getHighlightLayerByName('highlight')
				.addMesh(mesh as Mesh, Color3.Green());
		}
		this.#selected = true;
	}

	unselect() {
		if (!this.isInstanciated) {
			throw new ReferenceError('Cannot unselect a renderer that was not been instantiated');
		}
		for (const mesh of this.getChildMeshes()) {
			this.getScene()
				.getHighlightLayerByName('highlight')
				.removeMesh(mesh as Mesh);
		}
		this.#selected = false;
	}

	get currentPath() {
		return this.#currentPath;
	}

	async followPath(path: Vector3[]) {
		if (!Array.isArray(path)) throw new TypeError('path must be a Path');
		if (path.length == 0) {
			return;
		}
		if (this.#pathGizmo && settings.get('show_path_gizmos')) {
			this.#pathGizmo.dispose();
			this.#pathGizmo = null;
		}
		this.#currentPath = path;
		if (this.#pathGizmo) {
			console.warn('Path gizmo was already drawn and not disposed');
		} else if (settings.get('show_path_gizmos')) {
			this.#pathGizmo = MeshBuilder.CreateLines('pathGizmo.' + random.hex(16), { points: path }, this.getScene());
			this.#pathGizmo.color = Color3.Green();
		}

		const animation = new Animation('pathFollow', 'position', 60 * this.generic.speed, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT),
			rotateAnimation = new Animation('pathRotate', 'rotation', 60 * this.generic.agility, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);

		animation.setKeys(path.map((node, i) => ({ frame: i * 60 * this.generic.speed, value: node.subtract((this.parent as TransformNode).absolutePosition) })));
		rotateAnimation.setKeys(
			path.flatMap((node, i) => {
				if (i != 0) {
					const value = Vector3.PitchYawRollToMoveBetweenPoints(path[i - 1], node);
					value.x -= Math.PI / 2;
					return [
						{ frame: i * 60 * this.generic.agility - 30, value },
						{ frame: i * 60 * this.generic.agility - 10, value },
					];
				} else {
					return [{ frame: 0, value: this.rotation }];
				}
			})
		);
		this.animations.push(animation);
		this.animations.push(rotateAnimation);

		const result = this.getScene().beginAnimation(this, 0, path.length * 60);
		result.disposeOnEnd = true;
		await result.waitAsync();
		this.#currentPath = null;

		if (this.#pathGizmo) {
			this.#pathGizmo.dispose();
			this.#pathGizmo = null;
		}
	}

	get instance() {
		return this.#instance;
	}

	get isInstanciated() {
		return this.#createdInstance;
	}

	async createInstance(modelID) {
		//Async so we don't block while models are being instanciated

		if (!genericMeshes.has(modelID)) {
			throw new ReferenceError(`Model "${modelID}" does not exist`);
		}

		this.#instance = genericMeshes.get(modelID).instantiateModelsToScene().rootNodes[0] as TransformNode;
		this.#instance.id = this.id + ':instance';
		this.#instance.parent = this;
		this.#instance.rotation.y += Math.PI;

		this.#createdInstance = true;

		return this.#instance;
	}

	async update({ name, position, rotation, parent, nodeType, type }: SerializedEntity & { type?: string }, rendererType?: RendererType) {
		this.name = name;
		if (!this.#currentPath) {
			this.position = Vector3.FromArray(position);
			this.rotation = Vector3.FromArray(rotation);
		}
		const _type = rendererType || type || nodeType;
		if (this.rendererType != _type) {
			this.rendererType = _type;
			await this.createInstance(_type);
		}
		const _parent = this.getScene().getNodeById(parent);
		if (_parent != this.parent) {
			this.parent = _parent;
		}
	}
}

export const genericMeshes: Map<string, AssetContainer> = new Map();

export async function initModels(path: string, scene: Scene) {
	const container = await SceneLoader.LoadAssetContainerAsync(`${$build.asset_dir}/models/${path}.glb`, '', scene);
	Object.assign(container.meshes[0], {
		rotationQuaternion: null,
		material: Object.assign(container.materials[0], {
			realTimeFiltering: true,
			realTimeFilteringQuality: config.realtime_filtering_quality,
			reflectionTexture: scene.reflectionProbes[0].cubeTexture,
		}),
		position: Vector3.Zero(),
		isVisible: false,
		isPickable: false,
	});
	scene.reflectionProbes[0].renderList.push(container.meshes[1]);
	genericMeshes.set(path, container);
}

export type RendererType = Parameters<typeof genericMeshes.get>[0];
