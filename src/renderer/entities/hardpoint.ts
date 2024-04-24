import { Animation } from '@babylonjs/core/Animations/animation';
import type { Material } from '@babylonjs/core/Materials/material';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';
import { randomFloat, randomHex, randomInt, wait } from 'utilium';
import type { HardpointJSON } from '../../core/entities/hardpoint';
import type { GenericProjectile } from '../../core/generic/hardpoints';
import { randomCords } from '../../core/utils';
import { ModelRenderer } from '../models';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';

export interface CustomHardpointProjectileMaterial {
	applies_to: string[];
	material: Material;
}

export interface FireProjectileOptions extends GenericProjectile {
	materials: { applies_to: string[]; material: Material }[];
}

export interface HardpointProjectileHandlerOptions extends FireProjectileOptions {
	material?: Material;
}

export type HardpointProjectileHandler = (this: HardpointRenderer, target: TransformNode, options: HardpointProjectileHandlerOptions) => Promise<unknown>;

export class HardpointRenderer extends ModelRenderer implements Renderer<HardpointJSON> {
	projectiles = [];
	_projectile: HardpointProjectileHandler;
	constructor(id: string, scene: Scene) {
		super(id, scene);
	}

	fireProjectile(target: TransformNode, rawOptions: FireProjectileOptions) {
		const options: HardpointProjectileHandlerOptions = rawOptions;
		options.material = rawOptions.materials.find(({ applies_to = [], material }) => {
			if (applies_to.includes(this.rendererType) && material) {
				return material;
			}
		}, this)?.material;
		this._projectile.call(this, target, options);
	}

	async update(data: HardpointJSON) {
		if (this.rendererType != data.type) {
			this._projectile = HardpointRenderer.projectiles.get(data.type);
		}
		await super.update(data, data.type);
		if (this.isInstanciated && typeof data?.scale == 'number') {
			this.instance.scalingDeterminant = data.scale;
		}
	}

	static projectiles: Map<string, HardpointProjectileHandler> = new Map(
		Object.entries({
			async laser(target, { material, speed, id: modelID }) {
				await wait(randomInt(4, 40));
				const laser = new ModelRenderer(randomHex(32), this.getScene());
				await laser.createInstance(modelID);
				const bounding = this.getHierarchyBoundingVectors(),
					targetOffset = randomFloat(0, bounding.max.subtract(bounding.min).length()),
					startPos = this.getAbsolutePosition(),
					endPos = target.getAbsolutePosition().add(randomCords(targetOffset)),
					frameFactor = Vector3.Distance(startPos, endPos) / speed;
				this.projectiles.push(laser);
				for (const child of laser.getChildMeshes()) {
					child.material = material;
				}
				laser.scaling = this.scaling;
				laser.position = startPos;
				this.lookAt(endPos);
				laser.lookAt(endPos);
				const animation = new Animation('projectileAnimation', 'position', 60, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
				animation.setKeys([
					{ frame: 0, value: startPos },
					{ frame: 60 * frameFactor, value: endPos },
				]);
				laser.animations.push(animation);
				const result = this.getScene().beginAnimation(laser, 0, 60 * frameFactor);
				result.disposeOnEnd = true;
				result.onAnimationEnd = () => {
					this.projectiles.splice(this.projectiles.indexOf(laser), 1);
					laser.dispose();
					//update level (core-side)
				};
			},
		})
	);
}
HardpointRenderer satisfies RendererStatic<HardpointRenderer>;
entityRenderers.set('Hardpoint', HardpointRenderer);
