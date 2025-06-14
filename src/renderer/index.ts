import type { ArcRotateCameraPointersInput } from '@babylonjs/core';
import { ArcRotateCamera } from '@babylonjs/core';
import '@babylonjs/core/Animations/animatable';
import '@babylonjs/core/Culling'; // For Ray side effects
import { Engine } from '@babylonjs/core/Engines/engine';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import type { IVector3Like } from '@babylonjs/core/Maths/math.like';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { ReflectionProbe } from '@babylonjs/core/Probes/reflectionProbe';
import '@babylonjs/core/Rendering/boundingBoxRenderer'; // for showBoundingBox
import { Scene } from '@babylonjs/core/scene';
import type { BS_EntityJSON } from '../core/entities/.tmp.entity';
import type { BS_LevelJSON } from '../core/level';
import { config, currentVersion } from '../core/metadata';
import type { MoveInfo } from '../core/system';
import { EntityRenderer, PlanetMaterial, PlanetRenderer, ShipRenderer, renderers } from './entities';
import { logger } from './logger';
import { ModelRenderer, initModel, type ModelEntityJSON } from './models';
export { logger };

function createEmptyCache(): BS_LevelJSON {
	return {
		id: '',
		difficulty: 0,
		name: '',
		entities: [],
		date: '',
		systems: [],
		version: currentVersion,
	};
}

let skybox: Mesh,
	xzPlane: Mesh,
	camera: ArcRotateCamera,
	cache: BS_LevelJSON = createEmptyCache(),
	glow: GlowLayer;

export const cameraVelocity: Vector3 = Vector3.Zero();

export let engine: Engine, scene: Scene, highlight: HighlightLayer, probe: ReflectionProbe;

export function setHitboxes(value: boolean) {
	logger.debug((value ? 'Enabled' : 'Disabled') + ' hitboxes');
	for (const node of scene.transformNodes) {
		if (node instanceof EntityRenderer || node instanceof ModelRenderer) {
			for (const mesh of node.getChildMeshes()) {
				mesh.showBoundingBox = value;
			}
		}
	}
}

const entities: Map<string, EntityRenderer> = new Map();

export async function init(canvas: HTMLCanvasElement) {
	logger.debug('Initializing engine');
	engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
	engine.resize();

	addEventListener('resize', () => engine.resize());

	logger.debug('Initializing scene');
	scene = new Scene(engine);
	scene.ambientColor = Color3.White();

	logger.debug('Initializing camera');

	camera = new ArcRotateCamera('camera', -Math.PI / 2, Math.PI / 2, 5, Vector3.Zero(), scene);
	scene.activeCamera = camera;
	(camera.inputs.attached.pointers as ArcRotateCameraPointersInput).buttons = [1];
	Object.assign(camera, {
		wheelPrecision: 5,
		lowerRadiusLimit: 1,
		upperRadiusLimit: 50,
		minZ: 0.1,
		radius: 10,
	});

	logger.debug('Initializing skybox');
	skybox = MeshBuilder.CreateBox('skybox', { size: config.region_size / 10 }, scene);
	const skyMaterial = new StandardMaterial('skybox.mat', scene);
	skyMaterial.backFaceCulling = false;
	skyMaterial.disableLighting = true;
	skyMaterial.reflectionTexture = CubeTexture.CreateFromImages(Array(6).fill('assets/images/skybox.png'), scene);
	skyMaterial.reflectionTexture.coordinatesMode = 5;
	skybox.material = skyMaterial;
	skybox.infiniteDistance = true;
	skybox.isPickable = false;

	logger.debug('Initializing glow layer');
	glow = new GlowLayer('glowLayer', scene);
	glow.intensity = 0.9;

	logger.debug('Initializing highlight layer');
	highlight = new HighlightLayer('highlight', scene);

	xzPlane = MeshBuilder.CreatePlane('xzPlane', { size: config.region_size / 10 }, scene);
	xzPlane.rotation.x = Math.PI / 2;
	xzPlane.setEnabled(false);

	logger.debug('Initializing reflection probe');
	probe = new ReflectionProbe('probe', 256, scene);

	logger.debug('Initializing models');

	const models = ['apis', 'cillus', 'horizon', 'hurricane', 'inca', 'laser', 'laser_cannon_double', 'mosquito', 'pilsung', 'wind'];
	for (const id of models) {
		await initModel(id, scene);
	}
}

export function dispose() {
	if (!scene) {
		throw new ReferenceError('Renderer not initialized');
	}
	scene.dispose();
}

export function render() {
	if (!scene) {
		throw new ReferenceError('Renderer not initialized');
	}

	// camera
	camera.target.addInPlace(cameraVelocity);
	camera.alpha %= Math.PI * 2;
	camera.beta %= Math.PI * 2;
	cameraVelocity.scaleInPlace(0.9);

	// planet rotations
	const ratio = scene.getAnimationRatio();
	for (const entity of entities.values()) {
		if (!(entity instanceof PlanetRenderer)) {
			continue;
		}
		if (!(entity.mesh?.material instanceof PlanetMaterial)) {
			continue;
		}

		entity.rotation.y += 0.0001 * ratio * entity.mesh.material.rotationFactor;
		entity.mesh.material.setMatrix('rotation', Matrix.RotationY(entity.mesh.material.matrixAngle));
		entity.mesh.material.matrixAngle -= 0.0004 * ratio;
	}

	scene.render();
}

/**
 * Clears out loaded data and flushes the cache.
 */
export function clear() {
	if (!scene) {
		throw logger.error(new ReferenceError('Not initialized'));
	}

	for (const [id, entity] of entities) {
		entity.dispose();
		entities.delete(id);
	}

	engine.resize();
	cache = createEmptyCache();
	logger.debug('Cleared');
}

export function load(entityJSON: BS_EntityJSON[]): void {
	if (!scene) {
		throw logger.error(new ReferenceError('Not initialized'));
	}

	if (!entityJSON.length) {
		return;
	}

	logger.debug(`Loading ${entityJSON.length} entities`);
	for (const data of entityJSON) {
		logger.debug('Loading entity: ' + data.id);
		if (!renderers.has(data.type)) {
			logger.warn('rendering for entity type is not supported: ' + data.type);
			continue;
		}
		const entity = new (renderers.get(data.type)!)(data);
		entity.update(data);
		if (['Player', 'Client'].includes(data.type)) {
			/**
			 * @todo change this
			 */
			camera.target = entity.position.clone();
		}

		entity.update(data);
		entities.set(data.id, entity);
	}
}

export function update(levelData: BS_LevelJSON): void {
	if (!scene) {
		throw logger.error(new ReferenceError('Renderer not initialized'));
	}

	const renderersToAdd: BS_EntityJSON[] = [];

	if (levelData.id != cache.id && cache.id) {
		logger.warn(
			`Updating the renderer with a different system (${cache.id} -> ${levelData.id}). The renderer should be cleared first.`
		);
	}

	for (const entity of [...cache.entities, ...levelData.entities]) {
		const data = levelData.entities.find(_ => _.id == entity.id),
			cached = cache.entities.find(_ => _.id == entity.id);

		if (!renderers.has(data?.type ?? '')) {
			continue;
		}

		if (!cached) {
			renderersToAdd.push(entity);
			continue;
		}

		if (!data) {
			entities.get(entity.id)?.dispose();
			entities.delete(entity.id);
			continue;
		}

		void entities.get(entity.id)?.update(data);
	}

	load(renderersToAdd);
	cache = levelData;
	return;
}

export function resetCamera() {
	camera.alpha = -Math.PI / 2;
	camera.beta = Math.PI / 2;
	cameraVelocity.setAll(0);
}

export function addCameraVelocity(vector = Vector3.Zero()) {
	const direction = camera.getDirection(vector);
	direction.y = 0;
	direction.normalize().scaleInPlace(camera.radius / 10);
	cameraVelocity.addInPlace(direction);
}

export function getCamera() {
	if (!scene) {
		throw logger.error(new ReferenceError('Not initialized'));
	}

	if (!camera) {
		throw logger.error(new ReferenceError('Camera not initialized'));
	}

	return camera;
}

export function handleCanvasClick(ev: JQuery.ClickEvent, ownerID: string): void {
	if (!ev.shiftKey) {
		for (const entity of entities.values()) {
			if (entity instanceof ShipRenderer) {
				entity.unselect();
			}
		}
	}
	const pickInfo = scene.pick(ev.clientX, ev.clientY, mesh => {
		let entity: TransformNode = mesh;
		while (entity.parent) {
			if (entity instanceof ShipRenderer) {
				return true;
			}
			entity = entity.parent as TransformNode;
		}
		return false;
	});
	if (!pickInfo.pickedMesh) {
		return;
	}
	let entity: TransformNode = pickInfo.pickedMesh;
	while (entity.parent && !(entity instanceof ShipRenderer)) {
		entity = entity.parent as TransformNode;
	}
	if (entity instanceof ShipRenderer && entity.data.owner == ownerID) {
		entity.isSelected ? entity.unselect() : entity.select();
	}
}

/**
 * @todo simplify returned data?
 */
export function handleCanvasRightClick(evt: JQuery.ContextMenuEvent, ownerID: string): MoveInfo<Vector3>[] {
	const returnData: MoveInfo<Vector3>[] = [];
	// Note: This type assertion is used so `data` is well typed.
	for (const renderer of entities.values() as Iterable<ModelRenderer<ModelEntityJSON>>) {
		if (!(renderer instanceof ModelRenderer)) {
			continue;
		}

		if (!renderer.isSelected || renderer.data.owner != ownerID) {
			continue;
		}

		xzPlane.position = renderer.absolutePosition.clone();
		const { pickedPoint: target } = scene.pick(evt.clientX, evt.clientY, mesh => mesh == xzPlane);
		if (target) {
			returnData.push({ id: renderer.id, target });
		}
	}

	return returnData;
}

export function startFollowingPath(entityID: string, path: IVector3Like[], showPathGizmos: boolean) {
	const renderer = entities.get(entityID);
	if (!(renderer instanceof ModelRenderer)) {
		throw logger.error(new TypeError(`Node ${entityID} is not an entity`));
	}
	renderer.followPath(
		path.map(({ x, y, z }) => new Vector3(x, y, z)),
		showPathGizmos
	);
}
