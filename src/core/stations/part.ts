import type { Level } from '../level';
import type { CelestialBodyJSON } from '../entities/body';
import { CelestialBody } from '../entities/body';
import type { GenericStationPartID } from '../generic/station_part';
import { stationParts } from '../generic/station_part';
import type { Station } from './station';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { assignWithDefaults, pick } from 'utilium';

export interface StationPartJSON extends CelestialBodyJSON {
	hp: number;
	type: GenericStationPartID;
	connections: string[];
}

export class StationPart extends CelestialBody {
	public hp: number;
	public station: Station;
	public connections: StationPart[] = [];
	public type: GenericStationPartID;
	public constructor(id: string, level: Level) {
		super(id, level);
	}

	public get generic() {
		return stationParts[this.type];
	}

	public addPart(part: StationPart, thisConn: number, otherConn: number) {
		const thisConnecter = this.generic.connecters.at(thisConn),
			otherConnecter = part.generic.connecters.at(otherConn);
		if (!thisConnecter) {
			throw new ReferenceError('Connecter does not exist: ' + thisConn);
		}
		if (!otherConnecter) {
			throw new ReferenceError('Subcomponent connecter does not exist' + otherConn);
		}

		this.station.parts.add(part);
		this.connections[thisConn] = part;
		part.connections[otherConn] = this;

		part.parent = this;
		part.position = Vector3.FromArray(thisConnecter.position); //.add(otherConnecter.position);
		part.rotation = Vector3.FromArray(thisConnecter.rotation); //.add(otherConnecter.rotation);
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
			connections: this.connections.map(part => part.id),
		};
	}

	public fromJSON(data: Partial<StationPartJSON>): void {
		super.fromJSON(data);
		assignWithDefaults(this, pick(data, 'hp', 'type'));
		this.hp ||= this.generic.hp;
	}

	public remove() {
		this.station.parts.delete(this);
		for (const connection of this.connections) {
			this.removePart(connection);
		}
	}
}
