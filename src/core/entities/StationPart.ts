import type { Level } from '../Level';
import type { Combat } from '../components/combat';
import { GenericStationComponentID, stationComponents } from '../generic/stationComponents';
import { Entity } from './Entity';
import type { Station } from './Station';

export class StationPart extends Entity<{
	combat: Combat;
}> {
	station: Station;
	connections: StationPart[] = [];
	type: GenericStationComponentID;
	constructor(id: string, level: Level, { type }: StationComponentOptions) {
		super(id, level, { radius: 1, combat: { hp: this.generic.hp, power } });

		this.type = type;
		this.hp = this.generic.hp;
	}

	get generic() {
		return StationPart.generic[this.type];
	}

	addPart(part: StationPart, thisConn: number, otherConn: number) {
		const connection1 = this.generic.connecters.at(thisConn),
			connection2 = part.generic.connecters.at(otherConn);
		if (!connection1) {
			throw new ReferenceError(`Connecter "${thisConn}" does not exist`);
		}
		if (!connection2) {
			throw new ReferenceError(`Subcomponent connecter "${otherConn}" does not exist`);
		}

		this.station.components.push(part);
		this.connections[thisConn] = part;
		part.connections[otherConn] = this;

		part.parent = this;
		part.position = connection1.position.clone(); //.add(connection2.position);
		part.rotation = connection1.rotation.clone(); //.add(connection2.rotation);
	}

	removePart(part: StationPart) {
		this.connections[this.connections.indexOf(part)] = null;
		part.connections[part.connections.indexOf(this)] = null;
	}

	removePartAt(i: number) {
		const component = this.connections[i];
		return this.removePart(component);
	}

	remove() {
		this.station.components.splice(this.station.components.indexOf(this), 1);
		for (const connection of this.connections) {
			this.removePart(connection);
		}
	}

	static generic = stationComponents;
}
