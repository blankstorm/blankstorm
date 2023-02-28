import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import CelestialBody from './CelestialBody.js';

export default class StationComponent extends CelestialBody {
	_generic = {};
	#station;
	connections = [];
	constructor(id, level, { type, station }) {
		super(id, level, { radius: 1 });

		this._generic = StationComponent.generic.get(type);

		this.type = type;
		this.#station = station;
	}

	get station() {
		return this.#station;
	}

	set station(val) {
		this.#station = val;
	}

	get level() {
		return this.#station.level;
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
		return Object.assign(super.serialize(), {
			type: this.type,
			connections: this.connections.map(component => component.serialize()),
		});
	}

	remove() {
		this.#station.components.splice(this.#station.components.indexOf(this), 1);
		for (let connection of this.connections) {
			this.removeConnection(connection);
		}
	}

	static FromData(data, level) {
		return super.FromData(data, level, data);
	}

	static generic = new Map(
		Object.entries({
			core: {
				type: 'core',
				hp: 100,
				connecters: [
					{ type: '*', position: new Vector3(0, 0, 0), rotation: new Vector3(0, 0, 0) },
					{ type: '*', position: new Vector3(0, 0, 0), rotation: new Vector3(0, Math.PI / 2, 0) },
					{ type: '*', position: new Vector3(0, 0, 0), rotation: new Vector3(0, Math.PI, 0) },
					{ type: '*', position: new Vector3(0, 0, 0), rotation: new Vector3(0, (3 * Math.PI) / 2, 0) },
				],
			},
			connecter_i: {
				type: 'connecter',
				hp: 50,
				connecters: [
					{ type: '*', position: new Vector3(0, 0, -0.5), rotation: Vector3.Zero() },
					{ type: '*', position: new Vector3(0, 0, 0.5), rotation: Vector3.Zero() },
				],
			},
		})
	);
}
