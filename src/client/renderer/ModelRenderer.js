import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';

import '@babylonjs/loaders/glTF/index.js';

import config from './config.js';
import { probe } from './index.js';

/**
 * Internal class for rendering models. Other renderers (e.g. ShipRenderer) use this.
 */
export default class ModelRenderer extends TransformNode {
	#instance;
	#createdInstance = false;
	#selected = false;

	constructor(id, scene) {
		super(id, scene);
	}

	get instance() {
		return this.#instance;
	}

	isInstanciated() {
		return this.#createdInstance;
	}

	async createInstance(modelID) {
		//Async so we don't block while models are being instanciated

		if (!ModelRenderer.genericMeshes.has(modelID)) {
			throw new ReferenceError(`Model "${modelID}" does not exist`);
		}

		this.#instance = ModelRenderer.genericMeshes.get(modelID).instantiateModelsToScene().rootNodes[0];
		this.#instance.id = this.id;
		this.#instance.parent = this;

		this.#createdInstance = true;

		return this.#instance;
	}

	async update({ name, position, rotation, type } = {}){
		this.name = name;
		this.position = Vector3.FromArray(position);
		this.rotation = Vector3.FromArray(rotation);
		if(this.type != type){
			this.type = type;
			await this.createInstance(type);
		}
	}

	static async FromData(data, scene){
		const model = new this(data.id, scene);
		model.update(data);
		return model;
	}

	static modelPaths = new Map(
		Object.entries({
			wind: 'models/wind.glb',
			mosquito: 'models/mosquito.glb',
			cillus: 'models/cillus.glb',
			inca: 'models/inca.glb',
			pilsung: 'models/pilsung.glb',
			apis: 'models/apis.glb',
			hurricane: 'models/hurricane.glb',
			horizon: 'models/horizon.glb',
			laser: 'models/laser.glb',
			laser_projectile: 'models/laser_projectile.glb',
			station_core: 'models/station/core.glb',
			station_connecter_i: 'models/station/connecter_i.glb',
		})
	);

	static genericMeshes = new Map();

	static async InitModel(id, scene) {
		if (!this.modelPaths.has(id)) {
			throw new ReferenceError(`Model "${id}" does not exist`);
		}
		let container = await SceneLoader.LoadAssetContainerAsync('', this.modelPaths.get(id), scene);
		Object.assign(container.meshes[0], {
			rotationQuaternion: null,
			material: Object.assign(container.materials[0], {
				realTimeFiltering: true,
				realTimeFilteringQuality: [2, 8, 32][+config.render_quality],
				reflectionTexture: probe.cubeTexture,
			}),
			position: Vector3.Zero(),
			isVisible: false,
			isPickable: false,
		});
		probe.renderList.push(container.meshes[1]);
		ModelRenderer.genericMeshes.set(id, container);
	}
}
