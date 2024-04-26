import { ProceduralTexture } from '@babylonjs/core/Materials/Textures/Procedurals/proceduralTexture';
import { DynamicTexture } from '@babylonjs/core/Materials/Textures/dynamicTexture';
import { Texture } from '@babylonjs/core/Materials/Textures/texture';
import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import { randomHex } from 'utilium';
import type { PlanetData } from '../../core/entities/planet';
import type { planetBiomes } from '../../core/generic/planets';
import { cloudFragmentShader } from '../shaders/cloud.glslx';
import { noiseFragmentShader } from '../shaders/noise.glslx';
import * as planetShader from '../shaders/planet.glslx';
import { CelestialBodyRenderer } from './body';
import type { HardpointProjectileHandlerOptions } from './hardpoint';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';

export interface GenericPlanetRendererMaterial {
	clouds: boolean;
	upperColor: Color3;
	lowerColor: Color3;
	haloColor: Color3;
	seed: number;
	cloudSeed: number;
	lowerClamp: Vector2;
	groundAlbedo: number;
	cloudAlbedo: number;
	directNoise: boolean;
	lowerClip: Vector2;
	range: Vector2;
	maxResolution?: number;
	options?: Vector3;
}

export const textureConfig = {
	map_size: 1024,
	max_resolution: 128,
};

export class PlanetRendererMaterial extends ShaderMaterial {
	generationOptions: GenericPlanetRendererMaterial;
	rotationFactor = Math.random();
	matrixAngle = 0;
	noiseTexture: ProceduralTexture;
	cloudTexture: ProceduralTexture;
	constructor(options: GenericPlanetRendererMaterial, scene: Scene) {
		const id = randomHex(8);
		super('PlanetMaterial.' + id, scene, planetShader, {
			attributes: ['position', 'normal', 'uv'],
			uniforms: ['world', 'worldView', 'worldViewProjection', 'view', 'projection'],
			needAlphaBlending: true,
		});
		scene.onActiveCameraChanged.add(() => {
			this.setVector3('cameraPosition', scene.activeCamera.position);
		});
		this.generationOptions = options;

		this.setVector3('cameraPosition', scene.activeCamera?.position || Vector3.Zero());
		this.setVector3('lightPosition', Vector3.Zero());

		this.noiseTexture = this.generateTexture(
			id,
			{ fragmentSource: noiseFragmentShader },
			{ ...options, options: new Vector3(options.directNoise ? 1.0 : 0, options.lowerClip.x, options.lowerClip.y) },
			scene
		);
		this.setTexture('textureSampler', this.noiseTexture);

		this.cloudTexture = this.generateTexture(id, { fragmentSource: cloudFragmentShader }, { ...options, options: new Vector3(1.0, 0, 0) }, scene);
		this.setTexture('cloudSampler', this.cloudTexture);

		this.setColor3('haloColor', options.haloColor);
	}

	generateTexture(id: string, shader: string | Partial<{ fragmentSource: string; vertexSource: string }>, options: GenericPlanetRendererMaterial, scene: Scene) {
		const sampler = new DynamicTexture('CelestialBodyMaterial.sampler.' + id, 512, scene, false, Texture.NEAREST_SAMPLINGMODE);
		this.updateRandom(sampler);
		const texture = new ProceduralTexture('CelestialBodyMaterial.texture.' + id, textureConfig.map_size, shader, scene, null, true, true);
		texture.setColor3('upperColor', options.upperColor);
		texture.setColor3('lowerColor', options.lowerColor);
		texture.setFloat('mapSize', textureConfig.map_size);
		texture.setFloat('maxResolution', options.maxResolution || textureConfig.max_resolution);
		texture.setFloat('seed', options.seed);
		texture.setVector2('lowerClamp', options.lowerClamp);
		texture.setTexture('randomSampler', sampler);
		texture.setVector2('range', options.range);
		texture.setVector3('options', options.options);
		texture.refreshRate = 0;
		return texture;
	}

	updateRandom(texture: DynamicTexture) {
		if (!(texture instanceof DynamicTexture)) throw new TypeError(`Can't update texture: not a dynamic texture`);
		const context = texture.getContext(),
			imageData = context.getImageData(0, 0, 512, 512);
		for (let i = 0; i < 1048576; i++) {
			imageData.data[i] = (Math.random() * 256) | 0;
		}
		context.putImageData(imageData, 0, 0);
		texture.update();
	}
}

const biomes: Record<(typeof planetBiomes)[number], GenericPlanetRendererMaterial> = {
	earthlike: {
		clouds: false, //true,
		upperColor: new Color3(0.2, 2.0, 0.2),
		lowerColor: new Color3(0, 0.2, 1.0),
		haloColor: new Color3(0, 0.2, 1.0),
		seed: 0.3,
		cloudSeed: 0.6,
		lowerClamp: new Vector2(0.6, 1),
		groundAlbedo: 1.25,
		cloudAlbedo: 0,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: new Vector2(0.3, 0.35),
	},
	volcanic: {
		upperColor: new Color3(0.9, 0.45, 0.45),
		lowerColor: new Color3(1.0, 0, 0),
		haloColor: new Color3(1.0, 0, 0.3),
		seed: 0.3,
		cloudSeed: 0.6,
		clouds: false,
		lowerClamp: new Vector2(0, 1),
		maxResolution: 256,
		cloudAlbedo: 0,
		groundAlbedo: 1.0,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: new Vector2(0.3, 0.4),
	},
	jungle: {
		upperColor: new Color3(0.1, 0.3, 0.7),
		lowerColor: new Color3(0, 1.0, 0.1),
		haloColor: new Color3(0.5, 1.0, 0.5),
		seed: 0.4,
		cloudSeed: 0.7,
		clouds: false, //true,
		lowerClamp: new Vector2(0, 1),
		maxResolution: 512,
		cloudAlbedo: 1.0,
		groundAlbedo: 1.1,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: new Vector2(0.2, 0.4),
	},
	ice: {
		upperColor: new Color3(1.0, 1.0, 1.0),
		lowerColor: new Color3(0.7, 0.7, 0.9),
		haloColor: new Color3(1.0, 1.0, 1.0),
		seed: 0.8,
		cloudSeed: 0.4,
		clouds: false, //true,
		lowerClamp: new Vector2(0, 1),
		maxResolution: 256,
		cloudAlbedo: 1.0,
		groundAlbedo: 1.1,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: new Vector2(0.3, 0.4),
	},
	desert: {
		upperColor: new Color3(0.9, 0.3, 0),
		lowerColor: new Color3(1.0, 0.5, 0.1),
		haloColor: new Color3(1.0, 0.5, 0.1),
		seed: 0.18,
		cloudSeed: 0.6,
		clouds: false,
		lowerClamp: new Vector2(0.3, 1),
		maxResolution: 512,
		cloudAlbedo: 1.0,
		groundAlbedo: 1.0,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: new Vector2(0.3, 0.4),
	},
	islands: {
		upperColor: new Color3(0.4, 2.0, 0.4),
		lowerColor: new Color3(0, 0.2, 2.0),
		haloColor: new Color3(0, 0.2, 2.0),
		seed: 0.15,
		cloudSeed: 0.6,
		clouds: false, //true,
		lowerClamp: new Vector2(0.6, 1),
		maxResolution: 512,
		cloudAlbedo: 1.0,
		groundAlbedo: 1.2,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: new Vector2(0.2, 0.3),
	},
	moon: {
		upperColor: new Color3(2.0, 1.0, 0),
		lowerColor: new Color3(0, 0.2, 1.0),
		cloudSeed: 0.6,
		lowerClamp: new Vector2(0.6, 1),
		cloudAlbedo: 0.9,
		range: new Vector2(0.3, 0.35),
		haloColor: new Color3(0, 0, 0),
		seed: 0.5,
		clouds: false,
		groundAlbedo: 0.7,
		directNoise: true,
		lowerClip: new Vector2(0.5, 0.9),
	},
};

export class PlanetRenderer extends CelestialBodyRenderer implements Renderer<PlanetData> {
	biome = '';
	customHardpointProjectileMaterials: HardpointProjectileHandlerOptions['materials'];
	constructor(id: string, scene: Scene) {
		super(id, scene);
		this.customHardpointProjectileMaterials = [
			{
				applies_to: ['laser'],
				material: Object.assign(new StandardMaterial('player-laser-projectile'), { emissiveColor: Color3.Red() }),
			},
		];
	}

	async update(data: PlanetData) {
		await super.update(data);
		if (this.biome != data.biome) {
			if (Object.keys(biomes).includes(data.biome)) {
				this.biome = data.biome;
				this.material = new PlanetRendererMaterial(biomes[data.biome], this.getScene());
			} else {
				throw new ReferenceError(`Biome "${data.biome}" does not exist`);
			}
		}
	}
}
PlanetRenderer satisfies RendererStatic<PlanetRenderer>;
entityRenderers.set('Planet', PlanetRenderer);
