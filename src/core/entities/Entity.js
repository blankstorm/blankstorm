import Path from '../Path.js';
import { random } from '../utils.js';
import { config } from '../meta.js';

export default class extends BABYLON.TransformNode {
	_generic = { speed: 1 };

	#selected = false;

	constructor(type, owner, level, id = random.hex(32)) {
		//if (!(level instanceof Level)) throw new TypeError('passed level must be a Level'); Level not imported due to overhead
		super(id, level);
		this.id = id;
		this.owner = owner;
		this.level = level;
		this.#createInstance(type).catch(err => console.warn(`Failed to create entity mesh instance for #${id} of type ${type}: ${err}`));
		level.entities.set(this.id, this);
	}

	get entity() {
		return this;
	}

	get selected() {
		return this.#selected;
	}

	select() {
		[this.mesh, ...this.hardpoints.map(hp => hp.mesh)].forEach(mesh => {
			mesh.getChildMeshes().forEach(child => {
				this.level.hl.addMesh(child, BABYLON.Color3.Green());
			});
		});
		this.#selected = true;
	}

	unselect() {
		[this.mesh, ...this.hardpoints.map(hp => hp.mesh)].forEach(mesh => {
			mesh.getChildMeshes().forEach(child => {
				this.level.hl.removeMesh(child);
			});
		});
		this.#selected = false;
	}

	async #createInstance(type) {
		this.mesh = await this.level.instantiateGenericMesh(type);
		this.mesh.setParent(this);
		this.mesh.position = BABYLON.Vector3.Zero();
		this.mesh.rotation = new BABYLON.Vector3(0, 0, Math.PI);
	}

	remove() {
		this.mesh.dispose();
		this.getScene().entities.delete(this.id);
	}

	toString() {
		return `Entity #${this.id}`;
	}

	followPath(path) {
		if (!(path instanceof Path)) throw new TypeError('path must be a Path');
		return new Promise(resolve => {
			let animation = new BABYLON.Animation(
					'pathFollow',
					'position',
					60 * this._generic.speed,
					BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
					BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
				),
				rotateAnimation = new BABYLON.Animation(
					'pathRotate',
					'rotation',
					60 * this._generic.agility,
					BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
					BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
				);

			animation.setKeys(path.path.map((node, i) => ({ frame: i * 60 * this._generic.speed, value: node.position })));
			rotateAnimation.setKeys(
				path.path.flatMap((node, i) => {
					if (i != 0) {
						let value = BABYLON.Vector3.PitchYawRollToMoveBetweenPoints(path.path[i - 1].position, node.position);
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
		if (!(location instanceof BABYLON.Vector3)) throw new TypeError('location must be a Vector3');
		if (this.currentPath && config.settings.debug.show_path_gizmos) this.currentPath.disposeGizmo();
		this.currentPath = new Path(this.position, location.add(isRelative ? this.position : BABYLON.Vector3.Zero()), this.level);
		if (config.settings.debug.show_path_gizmos) this.currentPath.drawGizmo(this.level, BABYLON.Color3.Green());
		this.followPath(this.currentPath).then(() => {
			if (config.settings.debug.show_path_gizmos) {
				this.currentPath.disposeGizmo();
			}
		});
	}

	serialize() {
		return {
			position: this.position.asArray().map(num => +num.toFixed(3)),
			rotation: this.rotation.asArray().map(num => +num.toFixed(3)),
			owner: this.owner?.id,
			id: this.id,
			name: this.name,
			type: 'entity',
		};
	}
	static generic = new Map();
	static FromData(data, owner, level) {
		let entity = new this(data.type, owner, level, data.id);
		entity.position = BABYLON.Vector3.FromArray(data.position);
		entity.rotation = BABYLON.Vector3.FromArray(data.rotation);
		return entity;
	}
}
