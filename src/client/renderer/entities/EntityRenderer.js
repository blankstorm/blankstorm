import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode.js';
import { Animation } from '@babylonjs/core/Animations/animation.js';

import Path from 'core/Path.js';
import { settings } from 'client/index.js';
import { hl } from '../index.js';

export default class EntityRenderer extends TransformNode {
	#selected = false;
	#currentPath;

	constructor(id, scene) {
		super(id, scene);
	}

	get selected(){
		return this.#selected;
	}

	select() {
		this.getChildMeshes().forEach(mesh => {
			hl.addMesh(mesh, Color3.Green());
		});
		this.#selected = true;
	}

	unselect() {
		this.getChildMeshes().forEach(mesh => {
			hl.removeMesh(mesh);
		});
		this.#selected = false;
	}

	toString() {
		return `Entity #${this.id}`;
	}

	get currentPath(){
		return this.#currentPath;
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
				let result = this.getScene().beginAnimation(this, 0, path.path.length * 60);
				result.disposeOnEnd = true;
				result.onAnimationEnd = resolve;
			}
		});
	}

	async moveTo(location, isRelative) {
		if (!(location instanceof Vector3)) throw new TypeError('location must be a Vector3');
		if (this.#currentPath && settings.get('show_path_gizmos')) this.#currentPath.disposeGizmo();
		this.#currentPath = new Path(this.position, location.add(isRelative ? this.position : Vector3.Zero()), this.level);
		if (settings.get('show_path_gizmos')) this.#currentPath.drawGizmo(this.level, Color3.Green());
		await this.followPath(this.#currentPath);
		if (settings.get('show_path_gizmos')) {
			this.#currentPath.disposeGizmo();
			this.#currentPath = null;
		}
	}

	async update({ name, position, rotation, parent } = {}) {
		this.name = name;
		if(!this.#currentPath){
			this.position = Vector3.FromArray(position);
			this.rotation = Vector3.FromArray(rotation);
		}
		const _parent = this.getScene().getNodeById(parent);
		if (_parent != this.parent) {
			this.parent = _parent;
		}
	}

	static async FromData(data, scene) {
		const entity = new this(data.id, scene);
		await entity.update(data);
		return entity;
	}
}
