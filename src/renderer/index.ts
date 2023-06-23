import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector';
import { Scene } from '@babylonjs/core/scene';
import '@babylonjs/core/Animations/animatable';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer';
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer';
import { ReflectionProbe } from '@babylonjs/core/Probes/reflectionProbe';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture';
import { Engine } from '@babylonjs/core/Engines/engine';

import { Path } from '../core/Path';

import config from './config';
import { PlayerRenderer } from './nodes/Player';
import { PlanetRenderer, PlanetRendererMaterial } from './nodes/Planet';
import { StarRenderer } from './nodes/Star';
import { ModelRenderer } from './Model';
import { ShipRenderer } from './nodes/Ship';
import { EntityRenderer } from './nodes/Entity';
import { Camera } from './Camera';
import type { Mesh } from '@babylonjs/core/Meshes/mesh';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { FireProjectileOptions, HardpointRenderer } from './nodes/Hardpoint';
import type { SerializedSystem } from '../core/System';
import type { SerializedStar } from '../core/nodes/Star';
import type { SerializedPlanet } from '../core/nodes/Planet';
import type { SerializedPlayer } from '../core/nodes/Player';
import type { SerializedShip } from '../core/nodes/Ship';
import type { SerializedNode } from '../core/nodes/Node';
import type { Renderer } from './nodes/Renderer';

function createEmptyCache(): SerializedSystem {
	return {
		id: null,
		difficulty: null,
		name: null,
		nodes: [],
		connections: [],
		position: [],
	};
}

let skybox: Mesh,
	xzPlane: Mesh,
	camera: Camera,
	cache: SerializedSystem = createEmptyCache(),
	hitboxes = false,
	gl: GlowLayer;
export let engine: Engine, scene: Scene, hl: HighlightLayer, probe: ReflectionProbe;

export function setHitboxes(value: boolean) {
	hitboxes = !!value;
}

const nodes: Map<string, Renderer<SerializedNode>> = new Map();

export async function init(
	canvas: HTMLCanvasElement,
	messageHandler: (msg: string) => unknown = (msg: string) => {
		console.debug('init renderer: ' + msg);
	}
) {
	await messageHandler('engine');
	engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
	engine.resize();

	await messageHandler('scene');
	scene = new Scene(engine);

	await messageHandler('camera');
	camera = new Camera(scene);

	scene.registerBeforeRender(() => {
		const ratio = scene.getAnimationRatio();
		for (const node of nodes.values()) {
			if (node instanceof PlanetRenderer && node.material instanceof PlanetRendererMaterial) {
				node.rotation.y += 0.0001 * ratio * node.material.rotationFactor;
				node.material.setMatrix('rotation', Matrix.RotationY(node.material.matrixAngle));
				node.material.matrixAngle -= 0.0004 * ratio;
				const options = node.material.generationOptions;
				node.material.setVector3('options', new Vector3(+options.clouds, options.groundAlbedo, options.cloudAlbedo));
			}
		}
	});

	await messageHandler('skybox');
	skybox = MeshBuilder.CreateBox('skybox', { size: config.skybox_size }, scene);
	const skyboxMaterial = new StandardMaterial('skybox.mat', scene);
	skyboxMaterial.backFaceCulling = false;
	skyboxMaterial.disableLighting = true;
	skyboxMaterial.reflectionTexture = CubeTexture.CreateFromImages(Array(6).fill('images/skybox.jpg'), scene);
	skyboxMaterial.reflectionTexture.coordinatesMode = 5;
	skybox.material = skyboxMaterial;
	skybox.infiniteDistance = true;
	skybox.isPickable = false;

	await messageHandler('glow layer');
	gl = new GlowLayer('glowLayer', scene);
	gl.intensity = 0.9;

	await messageHandler('highlight layer');
	hl = new HighlightLayer('highlight', scene);

	xzPlane = MeshBuilder.CreatePlane('xzPlane', { size: config.plane_size }, scene);
	xzPlane.rotation.x = Math.PI / 2;
	xzPlane.setEnabled(false);

	await messageHandler('reflection probe');
	probe = new ReflectionProbe('probe', 256, scene);

	await messageHandler('assets');
	const modelKeys = [...ModelRenderer.modelPaths.keys()];
	// using forEach so we can get the index
	for (const id of modelKeys) {
		const i = modelKeys.indexOf(id);
		await messageHandler(`model "${id}" (${i + 1}/${modelKeys.length})`);
		await ModelRenderer.InitModel(id, scene);
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

	scene.meshes.forEach(mesh => {
		if (mesh instanceof PlanetRenderer || mesh instanceof StarRenderer) mesh.showBoundingBox = hitboxes;
		if (mesh.parent instanceof EntityRenderer) mesh.getChildMeshes().forEach(child => (child.showBoundingBox = hitboxes));
		//if (mesh != skybox && isHex(mesh.id)) mesh.showBoundingBox = hitboxes;
	});

	scene.render();
}

/**
 * Clears out loaded data and flushs the cache.
 */
export async function clear() {
	if (!scene) {
		throw new ReferenceError('Renderer not initalized');
	}

	for (const [id, node] of nodes) {
		node.dispose();
		nodes.delete(id);
	}

	engine.resize();
	cache = createEmptyCache();
}

export async function load(serializedNodes: SerializedNode[]) {
	if (!scene) {
		throw new ReferenceError('Renderer not initalized');
	}

	for (const data of serializedNodes) {
		let node;
		switch (data.nodeType) {
			case 'star':
				node = await StarRenderer.FromJSON(data as SerializedStar, scene);
				break;
			case 'planet':
				node = await PlanetRenderer.FromJSON(data as SerializedPlanet, scene);
				break;
			case 'player':
			case 'client':
				node = await PlayerRenderer.FromJSON(data as SerializedPlayer, scene);
				/**
				 * @todo change this
				 */
				camera.target = node.position;
				break;
			case 'ship':
				node = await ShipRenderer.FromJSON(data as SerializedShip, scene);
				break;
			default:
				throw new ReferenceError(`rendering for node type "${data.nodeType}" is not supported`);
		}

		nodes.set(data.id, node);
	}
}

export async function update(systemData: SerializedSystem) {
	if (!scene) {
		throw new ReferenceError('Renderer not initalized');
	}

	const renderersToAdd: SerializedNode[] = [];

	if (systemData.id != cache.id && cache.id) {
		console.warn(`Updating the renderer with a different system (${cache.id} -> ${systemData.id}). The renderer should be cleared first.`);
	}

	for (const node of [...cache.nodes, ...systemData.nodes]) {
		const data = systemData.nodes.find(_body => _body.id == node.id),
			cached = cache.nodes.find(_body => _body.id == node.id);
		if (!cached) {
			renderersToAdd.push(node);
			continue;
		}

		if (!data) {
			nodes.get(node.id).dispose();
			nodes.delete(node.id);
			continue;
		}

		nodes.get(node.id).update(data);
	}

	const result = await load(renderersToAdd);
	cache = systemData;
	return result;
}

export function getCamera() {
	if (!scene) {
		throw new ReferenceError('Renderer not initalized');
	}

	if (!camera) {
		throw new ReferenceError('Camera not initalized');
	}

	return camera;
}

export function handleCanvasClick(ev, owner) {
	owner ??= [...nodes.values()].filter(e => e instanceof PlayerRenderer)[0];
	if (!ev.shiftKey) {
		for (const node of nodes.values()) {
			if (node instanceof ShipRenderer) {
				node.unselect();
			}
		}
	}
	const pickInfo = scene.pick(ev.clientX, ev.clientY, mesh => {
		let node: TransformNode = mesh;
		while (node.parent) {
			node = node.parent as TransformNode;
			if (node instanceof ShipRenderer) {
				return true;
			}
		}
		return false;
	});
	if (pickInfo.pickedMesh) {
		let node: TransformNode = pickInfo.pickedMesh;
		while (node.parent && !(node instanceof ShipRenderer)) {
			node = node.parent as TransformNode;
		}
		if (node instanceof ShipRenderer && node.parent == owner) {
			if (node.selected) {
				node.unselect();
			} else {
				node.select();
			}
		}
	}
}

/**
 * @todo simplify returned data?
 */
export function handleCanvasRightClick(evt, owner) {
	const returnData = [];
	for (const renderer of nodes.values()) {
		if (renderer instanceof EntityRenderer && renderer.selected && renderer.parent == owner) {
			xzPlane.position = renderer.absolutePosition.clone();
			const pickInfo = scene.pick(evt.clientX, evt.clientY, mesh => mesh == xzPlane);
			if (pickInfo.pickedPoint) {
				returnData.push({ entityRenderer: renderer, point: pickInfo.pickedPoint });
			}
		}
	}

	return returnData;
}

export async function startFollowingPath(entityID: string, path: number[][]) {
	const renderer = nodes.get(entityID);
	if (!(renderer instanceof EntityRenderer)) {
		throw new TypeError(`Node ${entityID} is not an entity`);
	}
	await renderer.followPath(Path.FromJSON(path));
}

export function fireProjectile(hardpointID: string, target: TransformNode, options: FireProjectileOptions) {
	const hardpointRenderer = scene.getTransformNodeById(hardpointID) as HardpointRenderer,
		parent = hardpointRenderer?.parent?.parent as PlayerRenderer | PlanetRenderer,
		targetRenderer = scene.getTransformNodeById(target.id);
	hardpointRenderer.fireProjectile(targetRenderer, { ...options, materials: parent.customHardpointProjectileMaterials });
}
