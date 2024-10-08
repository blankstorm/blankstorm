import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { LinesMesh } from '@babylonjs/core/Meshes/linesMesh';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { AssetContainer } from '@babylonjs/core/assetContainer';
import type { Scene } from '@babylonjs/core/scene';
import '@babylonjs/loaders/glTF/index';
import { randomHex } from 'utilium';
import type { EntityJSON } from '../core/entities/entity';
import { EntityRenderer } from './entities/entity';
import { logger } from './logger';

interface ModelEntityJSON extends EntityJSON {
	model?: string;
	type?: string;
}

function resolveModelID(data: ModelEntityJSON): string {
	return data.model || data.type || data.entityType;
}

/**
 * Internal class for rendering models. Other renderers (e.g. ShipRenderer) use this.
 */
export class ModelRenderer<T extends ModelEntityJSON = ModelEntityJSON> extends EntityRenderer<T> {
	public readonly instance: TransformNode;
	protected _selected: boolean = false;
	protected _currentPath?: Vector3[];
	protected _pathGizmo?: LinesMesh;
	public readonly modelID: string;

	public constructor(data: T) {
		super(data);

		this.modelID = resolveModelID(data);

		if (!genericMeshes.has(this.modelID)) {
			throw new ReferenceError(`Model "${this.modelID}" does not exist`);
		}

		this.instance = genericMeshes.get(this.modelID)!.instantiateModelsToScene().rootNodes[0] as TransformNode;
		this.instance.id = this.id + ':instance';
		this.instance.parent = this;
		this.instance.rotation.y += Math.PI;
	}

	public get isSelected(): boolean {
		return this._selected;
	}

	public select(): void {
		for (const mesh of this.getChildMeshes<Mesh>()) {
			this.getScene().getHighlightLayerByName('highlight')?.addMesh(mesh, Color3.Green());
		}
		this._selected = true;
	}

	public unselect() {
		for (const mesh of this.getChildMeshes<Mesh>()) {
			this.getScene().getHighlightLayerByName('highlight')?.removeMesh(mesh);
		}
		this._selected = false;
	}

	public get currentPath() {
		return this._currentPath;
	}

	public followPath(path: Vector3[], showPathGizmos: boolean, { speed = 1, agility = 1 }: { speed?: number; agility?: number } = {}) {
		if (!path.length) {
			return;
		}

		if (this._pathGizmo) {
			this._pathGizmo.dispose();
			this._pathGizmo = undefined;
		}

		if (showPathGizmos) {
			this._pathGizmo = MeshBuilder.CreateLines(
				'pathGizmo.' + randomHex(16),
				{ points: path.map(point => point.add((this.parent as TransformNode).position)) },
				this.getScene()
			);
			this._pathGizmo.color = Color3.Green();
		}
	}

	// @todo change path following to be on core
	public update(data: T) {
		super.update(data);

		if (this.modelID != resolveModelID(data)) {
			throw logger.error(`Can not change model of entity ${data.id} from ${this.modelID} to ${resolveModelID(data)}`);
		}
	}
}

export const genericMeshes: Map<string, AssetContainer> = new Map();

export async function initModel(path: string, scene: Scene) {
	const container = await SceneLoader.LoadAssetContainerAsync(`assets/models/${path}.glb`, '', scene);
	Object.assign(container.meshes[0], {
		rotationQuaternion: null,
		material: Object.assign(container.materials[0], {
			realTimeFiltering: true,
			realTimeFilteringQuality: 32,
			reflectionTexture: scene.reflectionProbes[0].cubeTexture,
		}),
		position: Vector3.Zero(),
		isVisible: false,
		isPickable: false,
	});
	scene.reflectionProbes[0].renderList?.push(container.meshes[1]);
	genericMeshes.set(path, container);
	logger.debug('Loaded model asset: ' + path);
}
