import { Vector3, Matrix } from '@babylonjs/core/Maths/math.vector.js';
import { Scene } from '@babylonjs/core/scene.js';
import '@babylonjs/core/Animations/animatable.js';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder.js';
import { GlowLayer } from '@babylonjs/core/Layers/glowLayer.js';
import { HighlightLayer } from '@babylonjs/core/Layers/highlightLayer.js';
import { ReflectionProbe } from '@babylonjs/core/Probes/reflectionProbe.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';
import { CubeTexture } from '@babylonjs/core/Materials/Textures/cubeTexture.js';
import { Engine } from '@babylonjs/core/Engines/engine.js';

import config from './config.js';
import PlayerRenderer from './entities/PlayerRenderer.js';
import { default as PlanetRenderer, PlanetRendererMaterial } from './bodies/PlanetRenderer.js';
import StarRenderer from './bodies/StarRenderer.js';
import ModelRenderer from './ModelRenderer.js';
import ShipRenderer from './entities/ShipRenderer.js';
import EntityRenderer from './entities/EntityRenderer.js';
import Camera from './Camera.js';

let skybox,
	xzPlane,
	camera,
	cache = { entities: [], bodies: [] },
	hitboxes = false,
	gl;
export let engine, scene, hl, probe;

export function setHitboxes(value) {
	hitboxes = !!value;
}

const bodies = new Map(),
	entities = new Map();

export function handleCanvasClick(ev, owner) {
	owner ??= [...this.entities].filter(e => e instanceof PlayerRenderer)[0];
	if (!ev.shiftKey) {
		for (let entity of entities.values()) {
			if (entity instanceof ShipRenderer) {
				entity.unselect();
			}
		}
	}
	let pickInfo = scene.pick(ev.clientX, ev.clientY, mesh => {
		let node = mesh;
		while (node.parent) {
			node = node.parent;
			if (node instanceof ShipRenderer) {
				return true;
			}
		}
		return false;
	});
	if (pickInfo.pickedMesh) {
		let node = pickInfo.pickedMesh;
		while (node.parent && !(node instanceof ShipRenderer)) {
			node = node.parent;
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

export function handleCanvasRightClick(e, owner) {
	for (let entity of entities.values()) {
		if (entity.selected && entity.parent == owner) {
			xzPlane.position.y = entity.position.y;
			let pickInfo = scene.pick(e.clientX, e.clientY, mesh => mesh == xzPlane);
			if (pickInfo.pickedPoint) {
				entity.moveTo(pickInfo.pickedPoint, false);
			}
		}
	}
}

export async function init(canvas, messageHandler = () => {}) {
	await messageHandler('engine');
	engine = new Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
	engine.resize();

	await messageHandler('scene');
	scene = new Scene(engine);

	await messageHandler('camera');
	camera = new Camera(scene);

	scene.registerBeforeRender(() => {
		let ratio = scene.getAnimationRatio();
		for (let body of bodies.values()) {
			if (body instanceof PlanetRenderer && body.material instanceof PlanetRendererMaterial) {
				body.rotation.y += 0.0001 * ratio * body.material.rotationFactor;
				body.material.setMatrix('rotation', Matrix.RotationY(body.matrixAngle));
				body.matrixAngle -= 0.0004 * ratio;
				body.material.setVector3(
					'options',
					new Vector3(body.material.generationOptions.clouds, body.material.generationOptions.groundAlbedo, body.material.generationOptions.cloudAlbedo)
				);
			}
		}
	});

	await messageHandler('skybox');
	skybox = MeshBuilder.CreateBox('skybox', { size: config.skybox_size }, scene);
	skybox.material = Object.assign(new StandardMaterial('skybox.mat', scene), {
		backFaceCulling: false,
		disableLighting: true,
		reflectionTexture: CubeTexture.CreateFromImages(Array(6).fill('images/skybox.jpg'), scene),
	});
	skybox.material.reflectionTexture.coordinatesMode = 5;
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
	for (let id of modelKeys) {
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

	for (let [id, body] of bodies) {
		body.dispose();
		bodies.delete(id);
	}

	for (let [id, entity] of entities) {
		entity.dispose();
		entities.delete(id);
	}

	cache = { entities: [], bodies: [] };
}

export async function load(levelData) {
	if (!scene) {
		throw new ReferenceError('Renderer not initalized');
	}

	for (let data of levelData.bodies) {
		let body;
		switch (data.node_type) {
			case 'star':
				body = await StarRenderer.FromData(data, scene);
				break;
			case 'planet':
				body = await PlanetRenderer.FromData(data, scene);
				break;
			default:
				throw new ReferenceError(`rendering for CelestialBody type "${data.node_type}" is not supported`);
		}

		bodies.set(data.id, body);
	}

	for (let data of levelData.entities) {
		let entity;
		switch (data.node_type) {
			case 'player':
				entity = await PlayerRenderer.FromData(data, scene);
				/**
				 * @todo change this
				 */
				camera.target = entity.position;
				break;
			case 'ship':
				entity = await ShipRenderer.FromData(data, scene);
				break;
			default:
				throw new ReferenceError(`rendering for Entity type "${data.node_type}" is not supported`);
		}
		entities.set(data.id, entity);
	}
}

export async function update(levelData) {
	if (!scene) {
		throw new ReferenceError('Renderer not initalized');
	}

	const renderersToAdd = { bodies: [], entities: [] };

	if (levelData.id != cache.id && cache.id) {
		console.warn(`Updating the renderer with a different level (${cache.id} -> ${levelData.id}). The renderer should be cleared first.`);
	}

	for (let body of [...cache.bodies, ...levelData.bodies]) {
		const data = levelData.bodies.find(_body => _body.id == body.id),
			cached = cache.bodies.find(_body => _body.id == body.id);
		if (!cached) {
			renderersToAdd.bodies.push(body);
			continue;
		}

		if (!data) {
			bodies.get(body.id).dispose();
			bodies.delete(body.id);
			continue;
		}

		bodies.get(body.id).update(data);
	}

	for (let entity of [...cache.entities, ...levelData.entities]) {
		const data = levelData.entities.find(_entity => _entity.id == entity.id),
			cached = cache.entities.find(_entity => _entity.id == entity.id);
		if (!cached) {
			renderersToAdd.entities.push(entity);
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
		throw new ReferenceError('Renderer not initalized');
	}

	if (!camera) {
		throw new ReferenceError('Camera not initalized');
	}

	return camera;
}

export function fireProjectile(hardpoint, target, options) {
	const hardpointRenderer = scene.getTransformNodeByID(hardpoint.id),
		targetRenderer = scene.getTransformNodeByID(target.id);
	hardpointRenderer.fireProjectile(targetRenderer, options);
}

export async function serialize() {
	if (!scene) {
		throw new ReferenceError('Renderer not initalized');
	}
}
