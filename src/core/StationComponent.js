import { random } from './utils.js';

const StationComponent = class extends BABYLON.TransformNode {
	_generic = {};
	#station;
	#resolve;
	instanceReady;
	connections = [];
	constructor(type, station, id = random.hex(32)) {
		//if (!(station instanceof Station)) throw new TypeError(); Station not imported due to overhead
		//if (!(station.level instanceof Level)) throw new TypeError(); Level not imported due to overhead
		super(id, station.level);

		this._generic = StationComponent.generic.get(type);

		this.type = type;
		this.#station = station;

		let resolve;
		this.instanceReady = new Promise(res => (resolve = res));
		this.#resolve = resolve;
		this.#createInstance().catch(err => console.warn(`Failed to create hardpoint mesh instance for #${id} of type ${type}: ${err}`));
	}

	get station() {
		return this.#station;
	}

	get level() {
		return this.#station.level;
	}

	async #createInstance() {
		this.mesh = await this.level.instantiateGenericMesh('station.' + this.type);
		this.mesh.setParent(this);
		this.mesh.position = BABYLON.Vector3.Zero();
		this.mesh.rotation = new BABYLON.Vector3(0, 0, Math.PI);
		this.#resolve();
	}

	addConnection(component, connecter, componentConnecter) {
		let connection1 = this._generic.connecters.at(connecter),
			connection2 = component._generic.connecters.at(componentConnecter);
		if (!connection1) {
			throw new ReferenceError(`Connecter "${connecter}" does not exist`);
		}
		if (!connection2) {
			throw new ReferenceError(`Subcomponent connecter "${componentConnecter}" does not exist`);
		}

		this.#station.components.push(component);
		this.connections[connecter] = component;
		component.connections[componentConnecter] = this;

		component.parent = this;
		component.position = connection1.position.clone(); //.add(connection2.position);
		component.rotation = connection1.rotation.clone(); //.add(connection2.rotation);
	}

	removeConnection(component) {
		this.connections[this.connections.indexOf(component)] = undefined;
		component.connections[component.connections.indexOf(this)] = undefined;
	}

	removeConnectionAtIndex(connecter) {
		const component = this.connections[connecter];
		return this.removeConnection(component);
	}

	serialize() {
		return {
			id: this.id,
			type: this.type,
			position: this.position.asArray(),
			rotation: this.rotation.asArray(),
			connections: this.connections.map(component => component.serialize()),
		};
	}

	remove() {
		this.#station.components.splice(this.#station.components.indexOf(this), 1);
		for (let connection of this.connections) {
			this.removeConnection(connection);
		}
		this.dispose();
	}

	static generic = new Map([
		[
			'core',
			{
				type: 'core',
				hp: 100,
				model: 'models/station/core.glb',
				connecters: [
					{ type: '*', position: new BABYLON.Vector3(0, 0, 0), rotation: new BABYLON.Vector3(0, 0, 0) },
					{ type: '*', position: new BABYLON.Vector3(0, 0, 0), rotation: new BABYLON.Vector3(0, Math.PI / 2, 0) },
					{ type: '*', position: new BABYLON.Vector3(0, 0, 0), rotation: new BABYLON.Vector3(0, Math.PI, 0) },
					{ type: '*', position: new BABYLON.Vector3(0, 0, 0), rotation: new BABYLON.Vector3(0, (3 * Math.PI) / 2, 0) },
				],
			},
		],
		[
			'connecter_i',
			{
				type: 'connecter',
				hp: 50,
				model: 'models/station/connecter_i.glb',
				connecters: [
					{ type: '*', position: new BABYLON.Vector3(0, 0, -0.5), rotation: BABYLON.Vector3.Zero() },
					{ type: '*', position: new BABYLON.Vector3(0, 0, 0.5), rotation: BABYLON.Vector3.Zero() },
				],
			},
		],
	]);
};

export default StationComponent;
