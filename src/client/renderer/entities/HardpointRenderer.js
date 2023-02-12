import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Animation } from '@babylonjs/core/Animations/animation.js';

import { random, wait } from 'core/utils.js';
import ModelRenderer from '../ModelRenderer.js';

export default class HardpointRenderer extends ModelRenderer {
	projectiles = [];
	constructor(id, scene) {
		super(id, scene);
	}

	fireProjectile(target, options) {
		this._projectile.call(this, target, options);
	}

	async update({ name, position, rotation, type, parent, info } = {}) {
		if (this.type != type) {
			this._projectile = HardpointRenderer.projectiles.get(type);
		}
		await super.update({ name, position, rotation, type, parent });
		if (typeof info?.scale == 'number') {
			this.instance.scalingDeterminant = info.scale;
		}
	}

	static async FromData(data, scene) {
		const hardpoint = new this(data.id, scene);
		await hardpoint.update(data);
		return hardpoint;
	}

	static projectiles = new Map(
		Object.entries({
			async laser(target, { materials = [], speed, id: modelID } = {}) {
				await wait(random.int(4, 40));
				const laser = new ModelRenderer(random.hex(32), this.getScene());
				await laser.createInstance(modelID);
				const bounding = this.getHierarchyBoundingVectors(),
					targetOffset = random.float(0, bounding.max.subtract(bounding.min).length()),
					startPos = this.getAbsolutePosition(),
					endPos = target.getAbsolutePosition().add(random.cords(targetOffset)),
					frameFactor = Vector3.Distance(startPos, endPos) / speed,
					material = materials.find(({ applies_to = [], material }) => {
						if (applies_to.includes(this.type) && material) {
							return material;
						}
					}, this);
				this.projectiles.push(laser);
				laser.material = material?.material;
				for (let child of laser.getChildMeshes()) {
					child.material = material?.material;
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
				let result = this.getScene().beginAnimation(laser, 0, 60 * frameFactor);
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
