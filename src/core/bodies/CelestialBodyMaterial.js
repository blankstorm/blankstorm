import { config } from '../meta.js';
import { random } from '../utils.js';

export default class extends BABYLON.ShaderMaterial {
	constructor(options, level) {
		options.mapSize = 1024;
		options.maxResolution = [64, 256, 1024][config.render_quality];
		let id = random.hex(8);
		super('CelestialBodyMaterial.' + id, level, './shaders/planet', {
			attributes: ['position', 'normal', 'uv'],
			uniforms: ['world', 'worldView', 'worldViewProjection', 'view', 'projection'],
			needAlphaBlending: true,
		});
		level.onActiveCameraChanged.add(() => {
			this.setVector3('cameraPosition', level.activeCamera.position);
		});
		this.generationOptions = options;
		this.rotationFactor = Math.random();
		this.matrixAngle = 0;

		this.setVector3('cameraPosition', level.activeCamera?.position || BABYLON.Vector3.Zero());
		this.setVector3('lightPosition', BABYLON.Vector3.Zero());

		this.noiseTexture = this.generateTexture(
			id,
			'./shaders/noise',
			{ ...options, options: new BABYLON.Vector3(options.directNoise ? 1.0 : 0, options.lowerClip.x, options.lowerClip.y) },
			level
		);
		this.setTexture('textureSampler', this.noiseTexture);

		this.cloudTexture = this.generateTexture(id, './shaders/cloud', { ...options, options: new BABYLON.Vector3(1.0, 0, 0) }, level);
		this.setTexture('cloudSampler', this.cloudTexture);

		this.setColor3('haloColor', options.haloColor);
	}

	generateTexture(id, path, options, level) {
		let sampler = new BABYLON.DynamicTexture('CelestialBodyMaterial.sampler.' + id, 512, level, false, BABYLON.Texture.NEAREST_SAMPLINGMODE);
		this.updateRandom(sampler);
		let texture = new BABYLON.ProceduralTexture('CelestialBodyMaterial.texture.' + id, options.mapSize, path, level, null, true, true);
		texture.setColor3('upperColor', options.upperColor);
		texture.setColor3('lowerColor', options.lowerColor);
		texture.setFloat('mapSize', options.mapSize);
		texture.setFloat('maxResolution', options.maxResolution);
		texture.setFloat('seed', options.seed);
		texture.setVector2('lowerClamp', options.lowerClamp);
		texture.setTexture('randomSampler', sampler);
		texture.setVector2('range', options.range);
		texture.setVector3('options', options.options);
		texture.refreshRate = 0;
		return texture;
	}

	updateRandom(texture) {
		if (!(texture instanceof BABYLON.DynamicTexture)) throw new TypeError(`Can't update texture: not a dynamic texture`);
		let context = texture.getContext(),
			imageData = context.getImageData(0, 0, 512, 512);
		for (let i = 0; i < 1048576; i++) {
			imageData.data[i] = (Math.random() * 256) | 0;
		}
		context.putImageData(imageData, 0, 0);
		texture.update();
	}
}
