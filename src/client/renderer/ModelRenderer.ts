import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Animation } from '@babylonjs/core/Animations/animation';
import { hl } from './index';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';

import '@babylonjs/loaders/glTF/index';

import config from './config';
import { probe } from './index';
import Path from '../../core/Path';
import { settings } from '../index';
import { random } from '../../core/utils';

/**
 * Internal class for rendering models. Other renderers (e.g. ShipRenderer) use this.
 */
export default class ModelRenderer extends TransformNode {
	#instance;
	#selected = false;
	#currentPath;
	#createdInstance = false;
	#pathGizmo;

	constructor(id, scene) {
		super(id, scene);
	}

	get selected() {
		return this.#selected;
	}

	select() {
		if (!this.isInstanciated) {
			throw new ReferenceError('Cannot select a renderer that was not been instantiated');
		}
		this.getChildMeshes().forEach(mesh => {
			hl.addMesh(mesh, Color3.Green());
		});
		this.#selected = true;
	}

	unselect() {
		if (!this.isInstanciated) {
			throw new ReferenceError('Cannot unselect a renderer that was not been instantiated');
		}
		this.getChildMeshes().forEach(mesh => {
			hl.removeMesh(mesh);
		});
		this.#selected = false;
	}

	get currentPath() {
		return this.#currentPath;
	}

	async followPath(path) {
		if (!(path instanceof Path)) throw new TypeError('path must be a Path');
		if (path.path.length == 0) {
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
			this.#pathGizmo = MeshBuilder.CreateLines('pathGizmo.' + random.hex(16), { points: path.path.map(node => node.position) }, this.getScene());
			this.#pathGizmo.color = Color3.Green();
		}

		const animation = new Animation('pathFollow', 'position', 60 * this.generic.speed, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT),
			rotateAnimation = new Animation('pathRotate', 'rotation', 60 * this.generic.agility, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);

		animation.setKeys(path.path.map((node, i) => ({ frame: i * 60 * this.generic.speed, value: node.position.subtract(this.parent.absolutePosition) })));
		rotateAnimation.setKeys(
			path.path.flatMap((node, i) => {
				if (i != 0) {
					const value = Vector3.PitchYawRollToMoveBetweenPoints(path.path[i - 1].position, node.position);
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

		const result = this.getScene().beginAnimation(this, 0, path.path.length * 60);
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

		if (!ModelRenderer.genericMeshes.has(modelID)) {
			throw new ReferenceError(`Model "${modelID}" does not exist`);
		}

		this.#instance = ModelRenderer.genericMeshes.get(modelID).instantiateModelsToScene().rootNodes[0];
		this.#instance.id = this.id + ':instance';
		this.#instance.parent = this;
		this.#instance.rotation.y += Math.PI;

		this.#createdInstance = true;

		return this.#instance;
	}

	async update({ name, position, rotation, type, parent } = {}) {
		this.name = name;
		if (!this.#currentPath) {
			this.position = Vector3.FromArray(position);
			this.rotation = Vector3.FromArray(rotation);
		}
		if (this.type != type) {
			this.type = type;
			await this.createInstance(type);
		}
		const _parent = this.getScene().getNodeById(parent);
		if (_parent != this.parent) {
			this.parent = _parent;
		}
	}

	static async FromData(data, scene) {
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
		const container = await SceneLoader.LoadAssetContainerAsync('', this.modelPaths.get(id), scene);
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
