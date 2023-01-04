import { random, wait } from './utils.js';
import Ship from './entities/Ship.js';
import Level from './Level.js';

const Hardpoint = class extends BABYLON.TransformNode {
	_generic = {};
	#entity;
	#resolve;
	instanceReady;
	projectiles = [];
	constructor(data, ship, id = random.hex(32)) {
		if (!(ship instanceof Ship)) throw new TypeError();
		if (!(ship.level instanceof Level)) throw new TypeError();
		super(id);
		this._generic = Hardpoint.generic.get(data.type);
		this._data = data;

		this.type = data.type;
		this.parent = ship;
		this.#entity = ship;
		this.position = data.position || BABYLON.Vector3.Zero();
		this.rotation = (data.rotation || BABYLON.Vector3.Zero()).addInPlaceFromFloats(0, Math.PI, 0);
		this.reload = this._generic.reload;
		let resolve;
		this.instanceReady = new Promise(res => (resolve = res));
		this.#resolve = resolve;
		this.#createInstance().catch(err => console.warn(`Failed to create hardpoint mesh instance for #${id} of type ${data.type}: ${err}`));
		this.instanceReady.then(() => {
			this.scaling.scaleInPlace(data.scale ?? 1);
		});
	}

	get entity() {
		return this.#entity;
	}

	get level() {
		return this.#entity.level;
	}

	async #createInstance() {
		this.mesh = await this.level.instantiateGenericMesh(this.type);
		this.mesh.setParent(this);
		this.mesh.position = BABYLON.Vector3.Zero();
		this.mesh.rotation = new BABYLON.Vector3(0, 0, Math.PI);
		this.#resolve();
	}

	async createProjectileInstante() {
		return await this.level.instantiateGenericMesh(this.type + '.projectile');
	}

	remove() {
		this.#entity.hardpoints.splice(this.#entity.hardpoints.indexOf(this), 1);
		this.dispose();
	}

	fireProjectile(target, options) {
		this._generic.fire.call(this, target, options);
		this.reload = this._generic.reload;
	}

	static generic = new Map([
		[
			'laser',
			{
				damage: 1,
				reload: 10,
				range: 200,
				critChance: 0.05,
				critFactor: 1.5,
				model: 'models/laser.glb',
				projectiles: 1,
				projectileInterval: 0, //not needed
				projectileSpeed: 5,
				projectileModel: 'models/laser_projectile.glb',
				async fire(target, { projectileMaterials = [] }) {
					await wait(random.int(4, 40));
					const laser = await this.createProjectileInstante(),
						bounding = this.getHierarchyBoundingVectors(),
						targetOffset = random.float(0, bounding.max.subtract(bounding.min).length()),
						startPos = this.getAbsolutePosition(),
						endPos = target.getAbsolutePosition().add(random.cords(targetOffset)),
						frameFactor = BABYLON.Vector3.Distance(startPos, endPos) / this._generic.projectileSpeed,
						material = projectileMaterials.find(({ applies_to = [], material }) => {
							if (applies_to.includes(this.type) && material) {
								return material;
							}
						}, this);
					this.projectiles.push(laser);
					laser.material = material.material;
					for (let child of laser.getChildMeshes()) {
						child.material = material.material;
					}
					laser.scaling = this.scaling;
					laser.position = startPos;
					this.lookAt(endPos);
					laser.lookAt(endPos);
					const animation = new BABYLON.Animation(
						'projectileAnimation',
						'position',
						60,
						BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
						BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
					);
					animation.setKeys([
						{ frame: 0, value: startPos },
						{ frame: 60 * frameFactor, value: endPos },
					]);
					laser.animations.push(animation);
					let result = this.level.beginAnimation(laser, 0, 60 * frameFactor);
					result.disposeOnEnd = true;
					result.onAnimationEnd = () => {
						this.projectiles.splice(this.projectiles.indexOf(laser), 1);
						laser.dispose();
						target.entity.hp -= (this._generic.damage / Level.tickRate) * (Math.random() < this._generic.critChance ? this._generic.critFactor : 1);
					};
				},
			},
		],
	]);
};

export default Hardpoint;