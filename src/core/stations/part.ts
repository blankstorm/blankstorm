import type { Level } from '../level';
import type { CelestialBodyJSON } from '../entities/body';
import { CelestialBody } from '../entities/body';
import type { GenericStationPartID } from '../generic/station_part';
import { stationParts } from '../generic/station_part';
import type { Station } from './station';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { pick } from 'utilium';

export interface StationPartJSON extends CelestialBodyJSON {
	hp: number;
	type: string;
	connections: string[];
}

export interface StationPartOptions {
	type: GenericStationPartID;
}

export class StationPart extends CelestialBody {
	public hp: number;
	public station: Station;
	public connections: StationPart[] = [];
	public type: GenericStationPartID;
	public constructor(id: string, level: Level, { type }: StationPartOptions) {
		super(id, level, { radius: 1 });

		this.type = type;
		this.hp = this.generic.hp;
	}

	public get generic() {
		return stationParts[this.type];
	}

	public addPart(part: StationPart, thisConn: number, otherConn: number) {
		const connection1 = this.generic.connecters.at(thisConn),
			connection2 = part.generic.connecters.at(otherConn);
		if (!connection1) {
			throw new ReferenceError(`Connecter "${thisConn}" does not exist`);
		}
		if (!connection2) {
			throw new ReferenceError(`Subcomponent connecter "${otherConn}" does not exist`);
		}

		this.station.parts.push(part);
		this.connections[thisConn] = part;
		part.connections[otherConn] = this;

		part.parent = this;
		part.position = Vector3.FromArray(connection1.position); //.add(connection2.position);
		part.rotation = Vector3.FromArray(connection1.rotation); //.add(connection2.rotation);
	}

	public removePart(part: StationPart) {
		this.connections[this.connections.indexOf(part)] = null;
		part.connections[part.connections.indexOf(this)] = null;
	}

	public removePartAt(connecter: number) {
		const component = this.connections[connecter];
		return this.removePart(component);
	}

	public toJSON(): StationPartJSON {
		return {
			...super.toJSON(),
			...pick(this, 'type', 'hp'),
			connections: this.connections.map(component => component.id),
		};
	}

	public remove() {
		this.station.parts.splice(this.station.parts.indexOf(this), 1);
		for (const connection of this.connections) {
			this.removePart(connection);
		}
	}
}
