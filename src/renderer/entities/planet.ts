import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import { assignWithDefaults, pick, randomHex } from 'utilium';
import type { PlanetData } from '~/core/entities/planet';
import type { PlanetBiome } from '~/core/generic/planets';
import * as planetShader from '../shaders/planet.glslx';
import { CelestialBodyRenderer } from './body';
import type { HardpointProjectileHandlerOptions } from './hardpoint';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';
import { logger } from '../logger';

export interface PlanetMaterialOptions {
	colors: Color3[];
	range: number[];
	halo: Color3;
	base: number;
	lowerClamp: Vector2;
	groundAlbedo: number;
	directNoise: boolean;
	lowerClip: Vector2;
	resolution?: number;
	clouds?: {
		albedo: number;
		base: number;
	};
}

const biomes: Record<PlanetBiome, PlanetMaterialOptions> = {
	earthlike: {
		colors: [new Color3(0, 0.2, 1.0), new Color3(0.2, 0.8, 0.2)],
		range: [0.3, 0.35],
		halo: new Color3(0, 0.2, 1.0),
		base: 0.3,
		lowerClamp: new Vector2(0.6, 1),
		groundAlbedo: 1,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		clouds: {
			base: 0.6,
			albedo: 0.9,
		},
	},
	volcanic: {
		colors: [new Color3(1.0, 0, 0), new Color3(0.9, 0.45, 0.45)],
		range: [0.3, 0.4],
		halo: new Color3(1.0, 0, 0.3),
		base: 0.3,
		lowerClamp: new Vector2(0, 1),
		resolution: 256,
		groundAlbedo: 0.75,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
	},
	jungle: {
		colors: [new Color3(0, 0.9, 0.1), new Color3(0.1, 0.3, 0.7)],
		halo: new Color3(0.5, 1.0, 0.5),
		base: 0.4,
		lowerClamp: new Vector2(0, 1),
		resolution: 512,
		groundAlbedo: 0.85,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: [0.2, 0.4],
		clouds: {
			base: 0.7,
			albedo: 0.9,
		},
	},
	ice: {
		colors: [new Color3(0.7, 0.7, 0.9), new Color3(1.0, 1.0, 1.0)],
		halo: new Color3(1.0, 1.0, 1.0),
		base: 0.8,
		lowerClamp: new Vector2(0, 1),
		resolution: 256,
		groundAlbedo: 0.85,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: [0.3, 0.4],
		clouds: {
			base: 0.4,
			albedo: 0.8,
		},
	},
	desert: {
		colors: [new Color3(1.0, 0.5, 0.1), new Color3(0.9, 0.3, 0)],
		halo: new Color3(1.0, 0.5, 0.1),
		base: 0.18,
		lowerClamp: new Vector2(0.3, 1),
		resolution: 512,
		groundAlbedo: 0.75,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: [0.3, 0.4],
	},
	islands: {
		colors: [new Color3(0, 0.2, 2.0), new Color3(0.4, 2.0, 0.4)],
		halo: new Color3(0, 0.2, 2.0),
		base: 0.15,
		lowerClamp: new Vector2(0.6, 1),
		resolution: 512,
		groundAlbedo: 0.95,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: [0.2, 0.3],
		clouds: {
			base: 0.6,
			albedo: 0.9,
		},
	},
	moon: {
		colors: [new Color3(0, 0.2, 1.0), new Color3(1.0, 1.0, 0)],
		lowerClamp: new Vector2(0.6, 1),
		range: [0.3, 0.35],
		halo: new Color3(0, 0, 0),
		base: 0.5,
		groundAlbedo: 0.6,
		directNoise: true,
		lowerClip: new Vector2(0.5, 0.9),
	},
};

export class PlanetMaterial extends ShaderMaterial {
	public rotationFactor = Math.random();
	public matrixAngle = 0;
	public constructor(
		public readonly generationOptions: PlanetMaterialOptions,
		public readonly seed: number,
		public scene: Scene
	) {
		const id = randomHex(8);
		super('Planet:material:' + id, scene, planetShader, {
			attributes: ['position', 'normal'],
			uniforms: ['world', 'worldView', 'worldViewProjection', 'view', 'projection'],
			needAlphaBlending: true,
		});

		this.setVector3('camera', scene.activeCamera?.position || Vector3.Zero());
		this.setVector3('light', Vector3.Zero());
		this.setFloat('resolution', generationOptions.resolution || 128);
		this.setFloat('base', generationOptions.base);
		this.setFloat('seed', seed);

		this.setFloat('groundAlbedo', generationOptions.groundAlbedo);
		this.setColor3('halo', generationOptions.halo);

		if (generationOptions.colors.length != generationOptions.range.length) {
			logger.warn('Planet renderer colors and range length mismatch');
		}
		this.setInt('num_colors', generationOptions.colors.length);
		this.setColor3Array('colors', generationOptions.colors);
		this.setFloats('range', generationOptions.range);

		this.setVector2('lowerClamp', generationOptions.lowerClamp);
		this.setVector2('lowerClip', generationOptions.lowerClip);
		this.setInt('directNoise', +generationOptions.directNoise);

		// clouds
		this.setInt('clouds_enabled', +('clouds' in generationOptions));
		this.setFloat('clouds_albedo', generationOptions.clouds?.albedo ?? 0);
		this.setFloat('clouds_base', generationOptions.clouds?.base ?? 0);
	}
}

export class PlanetRenderer extends CelestialBodyRenderer implements Renderer<PlanetData> {
	public biome: PlanetBiome;
	public seed: number;
	public projectileMaterials: HardpointProjectileHandlerOptions['materials'] = [
		{
			applies_to: ['laser'],
			material: Object.assign(new StandardMaterial('player-laser-projectile'), { emissiveColor: Color3.Red() }),
		},
	];

	public async update(data: PlanetData) {
		await super.update(data);
		if (this.biome == data.biome && this.seed == data.seed) {
			return;
		}
		if (!(data.biome in biomes)) {
			throw new ReferenceError('Planet biome does not exist: ' + data.biome);
		}
		assignWithDefaults(this as PlanetRenderer, pick(data, 'biome', 'seed'));
		this.mesh.material = new PlanetMaterial(biomes[data.biome], this.seed, this.getScene());
	}
}
PlanetRenderer satisfies RendererStatic<PlanetRenderer>;
entityRenderers.set('Planet', PlanetRenderer);
