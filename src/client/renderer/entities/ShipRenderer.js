import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Animation } from '@babylonjs/core/Animations/animation.js';

import Path from 'core/Path.js';
import { settings } from 'client/index.js';
import { hl } from '../index.js';
import HardpointRenderer from './HardpointRenderer.js';
import ModelRenderer from '../ModelRenderer.js';
import Ship from 'core/entities/Ship.js';

export default class ShipRenderer extends ModelRenderer {
	hardpoints = new Map();
	#selected = false;
	constructor(id, scene) {
		super(id, scene);
	}

	get selected(){
		return this.#selected;
	}

	select() {
		if (!this.isInstanciated) {
			throw new ReferenceError('Cannot select a renderer that was not been instantiated');
		}
		[this.instance, ...[...this.hardpoints.values()].map(hp => hp.instance)].forEach(mesh => {
			mesh.getChildMeshes().forEach(child => {
				hl.addMesh(child, Color3.Green());
			});
		});
		this.#selected = true;
	}

	unselect() {
		if (!this.isInstanciated) {
			throw new ReferenceError('Cannot unselect a renderer that was not been instantiated');
		}
		[this.instance, ...[...this.hardpoints.values()].map(hp => hp.instance)].forEach(mesh => {
			mesh.getChildMeshes().forEach(child => {
				hl.removeMesh(child);
			});
		});
		this.#selected = false;
	}

	followPath(path) {
		if (!(path instanceof Path)) throw new TypeError('path must be a Path');
		return new Promise(resolve => {
			let animation = new Animation('pathFollow', 'position', 60 * this._generic.speed, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT),
				rotateAnimation = new Animation('pathRotate', 'rotation', 60 * this._generic.agility, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);

			animation.setKeys(path.path.map((node, i) => ({ frame: i * 60 * this._generic.speed, value: node.position })));
			rotateAnimation.setKeys(
				path.path.flatMap((node, i) => {
					if (i != 0) {
						let value = Vector3.PitchYawRollToMoveBetweenPoints(path.path[i - 1].position, node.position);
						value.x -= Math.PI / 2;
						return [
							{ frame: i * 60 * this._generic.agility - 30, value },
							{ frame: i * 60 * this._generic.agility - 10, value },
						];
					} else {
						return [{ frame: 0, value: this.rotation }];
					}
				})
			);
			if (path.path.length > 0) {
				this.animations.push(animation);
				this.animations.push(rotateAnimation);
				let result = this.level.beginAnimation(this, 0, path.path.length * 60);
				result.disposeOnEnd = true;
				result.onAnimationEnd = resolve;
			}
		});
	}

	moveTo(location, isRelative) {
		if (!(location instanceof Vector3)) throw new TypeError('location must be a Vector3');
		if (this.currentPath && settings.get('show_path_gizmos')) this.currentPath.disposeGizmo();
		this.currentPath = new Path(this.position, location.add(isRelative ? this.position : Vector3.Zero()), this.level);
		if (settings.get('show_path_gizmos')) this.currentPath.drawGizmo(this.level, Color3.Green());
		this.followPath(this.currentPath).then(() => {
			if (settings.get('show_path_gizmos')) {
				this.currentPath.disposeGizmo();
			}
		});
	}

	async update({ name, position, rotation, hardpoints = [], type, parent } = {}) {
		await super.update({ name, position, rotation, type, parent });
		for (let hardpointData of [...hardpoints]) {
			if (this.hardpoints.has(hardpointData.id)) {
				this.hardpoints.get(hardpointData.id).update(hardpointData);
			} else {
				const hardpoint = await HardpointRenderer.FromData(hardpointData, this.getScene());
				hardpoint.parent = this;
				this.hardpoints.set(hardpoint.id, hardpoint);
			}
		}
		this._generic = Ship.generic.get(type);
	}

	static async FromData(data, scene) {
		const ship = new this(data.id, scene);
		await ship.update(data);
		return ship;
	}
}
