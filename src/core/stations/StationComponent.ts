import { CelestialBody } from '../nodes/CelestialBody';
import type { SerializedCelestialBody } from '../nodes/CelestialBody';
import type { System } from '../System';
import type { Station } from './Station';
import { GenericStationComponentID, stationComponents } from '../generic/stationComponents';

export interface SerializedStationComponent extends SerializedCelestialBody {
	hp: number;
	type: string;
}

export interface StationComponentOptions {
	type: GenericStationComponentID;
}

export class StationComponent extends CelestialBody {
	hp: number;
	station: Station;
	connections: StationComponent[] = [];
	type: GenericStationComponentID;
	constructor(id: string, system: System, { type }: StationComponentOptions) {
		super(id, system, { radius: 1 });

		this.type = type;
		this.hp = this.generic.hp;
	}

	get generic() {
		return StationComponent.generic[this.type];
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

		this.station.components.push(component);
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

	toJSON(): SerializedStationComponent {
		return Object.assign(super.toJSON(), {
			type: this.type,
			hp: this.hp,
			connections: this.connections.map(component => component.toJSON()),
		});
	}

	remove() {
		this.station.components.splice(this.station.components.indexOf(this), 1);
		for (const connection of this.connections) {
			this.removeConnection(connection);
		}
	}

	static FromJSON(data: SerializedStationComponent, system: System): StationComponent {
		return <StationComponent>super.FromJSON(data, system, data);
	}

	static generic = stationComponents;
}
