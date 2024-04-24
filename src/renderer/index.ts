import '@babylonjs/core/Animations/animatable';
import '@babylonjs/core/Culling'; // For Ray side effects
import { Engine } from '@babylonjs/core/Engines/engine';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import type { IVector3Like } from '@babylonjs/core/Maths/math.like';
import { Matrix, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { ReflectionProbe } from '@babylonjs/core/Probes/reflectionProbe';
import '@babylonjs/core/Rendering/boundingBoxRenderer'; // for showBoundingBox
import { Scene } from '@babylonjs/core/scene';
import type { LevelJSON } from '../core/level';
import type { MoveInfo } from '../core/system';
import type { EntityJSON } from '../core/entities/entity';
import type { GenericProjectile } from '../core/generic/hardpoints';
import { version } from '../core/metadata';
import { Camera } from './camera';
import config from './config';
import { initModels } from './models';
import { EntityRenderer } from './entities/Entity';
import type { HardpointRenderer } from './entities/Hardpoint';
import { PlanetRenderer, PlanetRendererMaterial } from './entities/Planet';
import { PlayerRenderer } from './entities/Player';
import { ShipRenderer } from './entities/Ship';
import { StarRenderer } from './entities/Star';
import { createAndUpdate, entityRenderers, type Renderer } from './entities/renderer';
import { logger } from './logger';

export { logger };

function createEmptyCache(): LevelJSON {
	return {
		id: null,
		difficulty: null,
		name: null,
		entities: [],
		date: null,
		systems: [],
		version,
	};
}

let skybox: Mesh,
	xzPlane: Mesh,
	camera: Camera,
	cache: LevelJSON = createEmptyCache(),
	hitboxes = false,
	gl: GlowLayer;
export let engine: Engine, scene: Scene, hl: HighlightLayer, probe: ReflectionProbe;

export function setHitboxes(value: boolean) {
	hitboxes = !!value;
}

const entities: Map<string, Renderer<EntityJSON>> = new Map();

function onCanvasResive() {
	engine.resize();
}

export async function init(canvas: HTMLCanvasElement, messageHandler: (msg: string) => void) {
	messageHandler('engine');
	engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
	engine.resize();

	addEventListener('resize', onCanvasResive);

	messageHandler('scene');
	scene = new Scene(engine);

	messageHandler('camera');
	camera = new Camera(scene);

	scene.registerBeforeRender(() => {
		const ratio = scene.getAnimationRatio();
		for (const entity of entities.values()) {
			if (!(entity instanceof PlanetRenderer)) {
				continue;
			}
			if (!(entity?.material instanceof PlanetRendererMaterial)) {
				continue;
			}

			entity.rotation.y += 0.0001 * ratio * entity.material.rotationFactor;
			entity.material.setMatrix('rotation', Matrix.RotationY(entity.material.matrixAngle));
			entity.material.matrixAngle -= 0.0004 * ratio;
			const options = entity.material.generationOptions;
			entity.material.setVector3('options', new Vector3(+options.clouds, options.groundAlbedo, options.cloudAlbedo));
		}
	});

	messageHandler('skybox');
	skybox = MeshBuilder.CreateBox('skybox', { size: config.skybox_size }, scene);
	const skyboxMaterial = new StandardMaterial('skybox.mat', scene);
	skyboxMaterial.backFaceCulling = false;
	skyboxMaterial.disableLighting = true;
	skyboxMaterial.reflectionTexture = CubeTexture.CreateFromImages(Array(6).fill($build.asset_dir + '/images/skybox.png'), scene);
	skyboxMaterial.reflectionTexture.coordinatesMode = 5;
	skybox.material = skyboxMaterial;
	skybox.infiniteDistance = true;
	skybox.isPickable = false;

	messageHandler('glow layer');
	gl = new GlowLayer('glowLayer', scene);
	gl.intensity = 0.9;

	messageHandler('highlight layer');
	hl = new HighlightLayer('highlight', scene);

	xzPlane = MeshBuilder.CreatePlane('xzPlane', { size: config.plane_size }, scene);
	xzPlane.rotation.x = Math.PI / 2;
	xzPlane.setEnabled(false);

	messageHandler('reflection probe');
	probe = new ReflectionProbe('probe', 256, scene);

	messageHandler('models');

	const models = ['apis', 'cillus', 'horizon', 'hurricane', 'inca', 'laser', 'laser_cannon_double', 'mosquito', 'pilsung', 'wind'];
	for (const id of models) {
		messageHandler(`models (${id}) (${models.indexOf(id) + 1}/${models.length})`);
		await initModels(id, scene);
	}
}

export async function dispose() {
	if (!scene) {
		throw new ReferenceError('Renderer not initalized');
	}
	scene.dispose();
}

export async function render() {
	if (!scene) {
		throw new ReferenceError('Renderer not initalized');
	}

	for (const mesh of scene.meshes) {
		if (mesh instanceof PlanetRenderer || mesh instanceof StarRenderer) mesh.showBoundingBox = hitboxes;
		if (mesh.parent instanceof EntityRenderer) {
			for (const child of mesh.getChildMeshes()) {
				child.showBoundingBox = hitboxes;
			}
		}
		//if (mesh != skybox && isHex(mesh.id)) mesh.showBoundingBox = hitboxes;
	}

	scene.render();
}

/**
 * Clears out loaded data and flushs the cache.
 */
export async function clear() {
	if (!scene) {
		throw logger.error(new ReferenceError('Not initalized'));
	}

	for (const [id, entity] of entities) {
		entity.dispose();
		entities.delete(id);
	}

	engine.resize();
	cache = createEmptyCache();
	logger.debug('Cleared');
}

export async function load(serializedNodes: EntityJSON[]) {
	if (!scene) {
		throw logger.error(new ReferenceError('Not initalized'));
	}

	for (const data of serializedNodes) {
		if (!entityRenderers.has(data.entityType)) {
			logger.warn(`rendering for node type "${data.entityType}" is not supported`);
			continue;
		}
		const entity: Renderer = await createAndUpdate(entityRenderers.get(data.entityType), data, scene);
		if (['Player', 'Client'].includes(data.entityType)) {
			/**
			 * @todo change this
			 */
			camera.target = entity.position;
		}

		await entity.update(data);
		entities.set(data.id, entity);
	}
}

export async function update(levelData: LevelJSON) {
	if (!scene) {
		throw logger.error(new ReferenceError('Renderer not initalized'));
	}

	const renderersToAdd: EntityJSON[] = [];

	if (levelData.id != cache.id && cache.id) {
		logger.warn(`Updating the renderer with a different system (${cache.id} -> ${levelData.id}). The renderer should be cleared first.`);
	}

	for (const entity of [...cache.entities, ...levelData.entities]) {
		const data = levelData.entities.find(_ => _.id == entity.id),
			cached = cache.entities.find(_ => _.id == entity.id);

		if (!cached) {
			renderersToAdd.push(entity);
			continue;
		}

		if (!data) {
			entities.get(entity.id).dispose();
			entities.delete(entity.id);
			continue;
		}

		entities.get(entity.id).update(data);
	}

	const result = await load(renderersToAdd);
	cache = levelData;
	return result;
}

export function getCamera() {
	if (!scene) {
		throw logger.error(new ReferenceError('Not initalized'));
	}

	if (!camera) {
		throw logger.error(new ReferenceError('Camera not initalized'));
	}

	return camera;
}

export function handleCanvasClick(ev: JQuery.ClickEvent, ownerID: string) {
	ownerID ??= [...entities.values()].find(e => e instanceof PlayerRenderer)?.id;
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
			entity = entity.parent as TransformNode;
			if (entity instanceof ShipRenderer) {
				return true;
			}
		}
		return false;
	});
	if (pickInfo.pickedMesh) {
		let entity: TransformNode = pickInfo.pickedMesh;
		while (entity.parent && !(entity instanceof ShipRenderer)) {
			entity = entity.parent as TransformNode;
		}
		if (entity instanceof ShipRenderer && entity.parent?.id == ownerID) {
			if (entity.selected) {
				entity.unselect();
			} else {
				entity.select();
			}
		}
	}
}

/**
 * @todo simplify returned data?
 */
export function handleCanvasRightClick(evt: JQuery.ContextMenuEvent, ownerID: string): MoveInfo<Vector3>[] {
	const returnData: MoveInfo<Vector3>[] = [];
	for (const renderer of entities.values()) {
		if (renderer instanceof EntityRenderer && renderer.selected && renderer.parent?.id == ownerID) {
			xzPlane.position = renderer.absolutePosition.clone();
			const { pickedPoint: target } = scene.pick(evt.clientX, evt.clientY, mesh => mesh == xzPlane);
			if (target) {
				returnData.push({ id: renderer.id, target });
			}
		}
	}

	return returnData;
}

export async function startFollowingPath(entityID: string, path: IVector3Like[]) {
	const renderer = entities.get(entityID);
	if (!(renderer instanceof EntityRenderer)) {
		throw logger.error(new TypeError(`Node ${entityID} is not an entity`));
	}
	await renderer.followPath(path.map(({ x, y, z }) => new Vector3(x, y, z)));
}

export function fireProjectile(hardpointID: string, targetID: string, options: GenericProjectile) {
	const hardpointRenderer = scene.getTransformNodeById(hardpointID) as HardpointRenderer,
		parent = hardpointRenderer?.parent?.parent as PlayerRenderer | PlanetRenderer,
		targetRenderer = scene.getTransformNodeById(targetID);
	hardpointRenderer.fireProjectile(targetRenderer, { ...options, materials: parent.customHardpointProjectileMaterials });
}

export function attachControl(): void {
	getCamera().attachControl(true);
}
