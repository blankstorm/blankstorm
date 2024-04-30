import { Animation } from '@babylonjs/core/Animations/animation';
import type { Material } from '@babylonjs/core/Materials/material';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import type { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import type { Scene } from '@babylonjs/core/scene';
import { randomFloat, randomHex, randomInt, wait } from 'utilium';
import type { HardpointJSON } from '../../core/entities/hardpoint';
import { genericHardpoints, type GenericProjectile, type HardpointType } from '../../core/generic/hardpoints';
import { randomCords } from '../../core/utils';
import { ModelRenderer } from '../models';
import { entityRenderers, type Renderer, type RendererStatic } from './renderer';

export interface ProjectileMaterial {
	applies_to: string[];
	material: Material;
}

export interface FireProjectileOptions extends GenericProjectile {
	materials: ProjectileMaterial[];
}

export interface HardpointProjectileHandlerOptions extends FireProjectileOptions {
	material?: Material;
}

export type HardpointProjectileHandler = (this: HardpointRenderer, target: TransformNode, options: HardpointProjectileHandlerOptions) => Promise<unknown>;

const projectiles: Record<string, HardpointProjectileHandler> = {
	async laser(target, { material, speed, id: modelID }) {
		await wait(randomInt(4, 40));
		const laser = new ModelRenderer(randomHex(32), this.getScene());
		await laser.createInstance(modelID);
		const bounding = this.getHierarchyBoundingVectors(),
			targetOffset = randomFloat(0, bounding.max.subtract(bounding.min).length()),
			startPos = this.getAbsolutePosition(),
			endPos = target.getAbsolutePosition().add(randomCords(targetOffset)),
			frameFactor = Vector3.Distance(startPos, endPos) / speed;
		this.projectiles.add(laser);
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
			this.projectiles.delete(laser);
			laser.dispose();
		};
	},
};

export class HardpointRenderer extends ModelRenderer implements Renderer<HardpointJSON> {
	public projectiles: Set<Renderer> = new Set();
	protected _projectile: HardpointProjectileHandler;
	public declare rendererType: HardpointType;
	public constructor(id: string, scene: Scene) {
		super(id, scene);
	}

	public fireProjectile(target: TransformNode, rawOptions: FireProjectileOptions) {
		const options: HardpointProjectileHandlerOptions = rawOptions;
		options.material = rawOptions.materials.find(({ applies_to = [], material }) => {
			if (applies_to.includes(genericHardpoints[this.rendererType].projectile.id) && material) {
				return material;
			}
		}, this)?.material;
		this._projectile.call(this, target, options);
	}

	public async update(data: HardpointJSON) {
		if (this.rendererType != data.type) {
			this._projectile = projectiles[data.type];
		}
		await super.update(data);
		if (!this.isInstanciated) {
			return;
		}
		this.instance.scaling.setAll(data.scale);
		this.instance.scalingDeterminant = data.scale;
	}
}
HardpointRenderer satisfies RendererStatic<HardpointRenderer>;
entityRenderers.set('Hardpoint', HardpointRenderer);
