import { CelestialBody } from './CelestialBody';
import type { SerializedCelestialBody } from './CelestialBody';
import type { Level } from '../Level';
import type { Station } from './Station';
import { GenericStationComponentID, stationComponents } from '../generic/stationComponents';

export interface SerializedStationComponent extends SerializedCelestialBody {
	hp: number;
	type: string;
}

export class StationComponent extends CelestialBody {
	hp: number;
	#station: Station;
	connections: StationComponent[] = [];
	type: GenericStationComponentID;
	constructor(id: string, level: Level, { type, station }) {
		super(id, level, { radius: 1 });

		this.type = type;
		this.hp = this.generic.hp;
		this.#station = station;
	}

	get generic() {
		return StationComponent.generic[this.type];
	}

	get station() {
		return this.#station;
	}

	set station(val) {
		this.#station = val;
	}

	addConnection(component: StationComponent, thisConnecter: number, componentConnecter: number) {
		const connection1 = this.generic.connecters.at(thisConnecter),
			connection2 = component.generic.connecters.at(componentConnecter);
		if (!connection1) {
			throw new ReferenceError(`Connecter "${thisConnecter}" does not exist`);
		}
		if (!connection2) {
			throw new ReferenceError(`Subcomponent connecter "${componentConnecter}" does not exist`);
		}

		this.#station.components.push(component);
		this.connections[thisConnecter] = component;
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

	serialize(): SerializedStationComponent {
		return Object.assign(super.serialize(), {
			type: this.type,
			hp: this.hp,
			connections: this.connections.map(component => component.serialize()),
		});
	}

	remove() {
		this.#station.components.splice(this.#station.components.indexOf(this), 1);
		for (const connection of this.connections) {
			this.removeConnection(connection);
		}
	}

	static FromData(data: SerializedStationComponent, level: Level): StationComponent {
		return super.FromData(data, level, data) as StationComponent;
	}

	static generic = stationComponents;
}
