import { ShaderMaterial } from '@babylonjs/core/Materials/shaderMaterial';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { Scene } from '@babylonjs/core/scene';
import { randomHex } from 'utilium';
import type { PlanetData } from '../../core/entities/planet';
import type { PlanetBiome } from '../../core/generic/planets';
import * as planetShader from '../shaders/planet.glslx';
import { CelestialBodyRenderer } from './body';
import type { HardpointProjectileHandlerOptions } from './hardpoint';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';

export interface PlanetMaterialOptions {
	clouds?: {
		albedo: number;
		base: number;
	};
	upperColor: Color3;
	lowerColor: Color3;
	halo: Color3;
	base: number;
	lowerClamp: Vector2;
	groundAlbedo: number;
	directNoise: boolean;
	lowerClip: Vector2;
	range: Vector2;
	resolution?: number;
}

const biomes: Record<PlanetBiome, PlanetMaterialOptions> = {
	earthlike: {
		upperColor: new Color3(0.2, 2.0, 0.2),
		lowerColor: new Color3(0, 0.2, 1.0),
		halo: new Color3(0, 0.2, 1.0),
		base: 0.3,
		lowerClamp: new Vector2(0.6, 1),
		groundAlbedo: 1,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: new Vector2(0.3, 0.35),
		clouds: {
			base: 0.6,
			albedo: 0.9,
		},
	},
	volcanic: {
		upperColor: new Color3(0.9, 0.45, 0.45),
		lowerColor: new Color3(1.0, 0, 0),
		halo: new Color3(1.0, 0, 0.3),
		base: 0.3,
		lowerClamp: new Vector2(0, 1),
		resolution: 256,
		groundAlbedo: 0.75,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: new Vector2(0.3, 0.4),
	},
	jungle: {
		upperColor: new Color3(0.1, 0.3, 0.7),
		lowerColor: new Color3(0, 1.0, 0.1),
		halo: new Color3(0.5, 1.0, 0.5),
		base: 0.4,
		lowerClamp: new Vector2(0, 1),
		resolution: 512,
		groundAlbedo: 0.85,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: new Vector2(0.2, 0.4),
		clouds: {
			base: 0.7,
			albedo: 0.9,
		},
	},
	ice: {
		upperColor: new Color3(1.0, 1.0, 1.0),
		lowerColor: new Color3(0.7, 0.7, 0.9),
		halo: new Color3(1.0, 1.0, 1.0),
		base: 0.8,
		lowerClamp: new Vector2(0, 1),
		resolution: 256,
		groundAlbedo: 0.85,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: new Vector2(0.3, 0.4),
		clouds: {
			base: 0.4,
			albedo: 0.8,
		},
	},
	desert: {
		upperColor: new Color3(0.9, 0.3, 0),
		lowerColor: new Color3(1.0, 0.5, 0.1),
		halo: new Color3(1.0, 0.5, 0.1),
		base: 0.18,
		lowerClamp: new Vector2(0.3, 1),
		resolution: 512,
		groundAlbedo: 0.75,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: new Vector2(0.3, 0.4),
	},
	islands: {
		upperColor: new Color3(0.4, 2.0, 0.4),
		lowerColor: new Color3(0, 0.2, 2.0),
		halo: new Color3(0, 0.2, 2.0),
		base: 0.15,
		lowerClamp: new Vector2(0.6, 1),
		resolution: 512,
		groundAlbedo: 0.95,
		directNoise: false,
		lowerClip: new Vector2(0, 0),
		range: new Vector2(0.2, 0.3),
		clouds: {
			base: 0.6,
			albedo: 0.9,
		},
	},
	moon: {
		upperColor: new Color3(2.0, 1.0, 0),
		lowerColor: new Color3(0, 0.2, 1.0),
		lowerClamp: new Vector2(0.6, 1),
		range: new Vector2(0.3, 0.35),
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
		public scene: Scene
	) {
		const id = randomHex(8);
		super('Planet:material:' + id, scene, planetShader, {
			attributes: ['position', 'normal', 'uv'],
			uniforms: ['world', 'worldView', 'worldViewProjection', 'view', 'projection'],
			needAlphaBlending: true,
		});

		const size = 1024,
			seed = Math.random();

		this.setVector3('camera', scene.activeCamera.position || Vector3.Zero());
		this.setVector3('light', Vector3.Zero());
		this.setFloat('groundAlbedo', generationOptions.groundAlbedo);
		this.setColor3('halo', generationOptions.halo);
		this.setColor3('upperColor', generationOptions.upperColor);
		this.setColor3('lowerColor', generationOptions.lowerColor);
		this.setFloat('size', size);
		this.setFloat('resolution', generationOptions.resolution || 128);
		this.setFloat('base', generationOptions.base);

		this.setFloat('seed', seed);
		this.setVector2('lowerClamp', generationOptions.lowerClamp);
		this.setVector2('range', generationOptions.range);
		this.setVector2('lowerClip', generationOptions.lowerClip);
		this.setInt('directNoise', +generationOptions.directNoise);

		// clouds
		this.setInt('clouds', +('clouds' in generationOptions));
		this.setFloat('cloud_albedo', generationOptions.clouds?.albedo);
		this.setFloat('cloud_base', generationOptions.clouds?.base);
	}
}

export class PlanetRenderer extends CelestialBodyRenderer implements Renderer<PlanetData> {
	public biome: PlanetBiome;
	public customHardpointProjectileMaterials: HardpointProjectileHandlerOptions['materials'];
	public constructor(id: string, scene: Scene) {
		super(id, scene);
		this.customHardpointProjectileMaterials = [
			{
				applies_to: ['laser'],
				material: Object.assign(new StandardMaterial('player-laser-projectile'), { emissiveColor: Color3.Red() }),
			},
		];
	}

	public async update(data: PlanetData) {
		await super.update(data);
		if (this.biome == data.biome) {
			return;
		}
		if (!(data.biome in biomes)) {
			throw new ReferenceError('Planet biome does not exist: ' + data.biome);
		}
		this.biome = data.biome;
		this.material = new PlanetMaterial(biomes[data.biome], this.getScene());
	}
}
PlanetRenderer satisfies RendererStatic<PlanetRenderer>;
entityRenderers.set('Planet', PlanetRenderer);
