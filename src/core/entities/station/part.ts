import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { assignWithDefaults, pick } from 'utilium';
import type { CelestialBodyJSON } from '../body.js';
import { CelestialBody } from '../body.js';
import type { GenericStationPartID } from '../../generic/station.js';
import { stationParts } from '../../generic/station.js';
import type { Station } from '../station.js';

export interface StationPartJSON extends CelestialBodyJSON {
	hp: number;
	type: GenericStationPartID;
	connections: (string | undefined)[];
}

export class StationPart extends CelestialBody {
	public hp: number = -1;
	public station!: Station;
	public connections: (StationPart | undefined)[] = [];
	public type!: GenericStationPartID;

	public get generic() {
		return stationParts[this.type];
	}

	public addPart(part: StationPart, thisConn: number, otherConn: number) {
		const thisConnector = this.generic.connectors.at(thisConn),
			otherConnector = part.generic.connectors.at(otherConn);
		if (!thisConnector) {
			throw new ReferenceError('Connector does not exist: ' + thisConn);
		}
		if (!otherConnector) {
			throw new ReferenceError('Subcomponent connector does not exist' + otherConn);
		}

		this.station.parts.add(part);
		this.connections[thisConn] = part;
		part.connections[otherConn] = this;

		part.parent = this;
		part.position = Vector3.FromArray(thisConnector.position); //.add(otherConnector.position);
		part.rotation = Vector3.FromArray(thisConnector.rotation); //.add(otherConnector.rotation);
	}

	public removePart(part: StationPart | undefined) {
		if (!part) {
			return;
		}
		this.connections[this.connections.indexOf(part)] = undefined;
		part.connections[part.connections.indexOf(this)] = undefined;
	}

	public removePartAt(connector: number) {
		const component = this.connections[connector];
		return this.removePart(component);
	}

	public toJSON(): StationPartJSON {
		return {
			...super.toJSON(),
			...pick(this, 'type', 'hp'),
			connections: this.connections.map(part => part?.id),
		};
	}

	public fromJSON(data: Partial<StationPartJSON>): void {
		super.fromJSON(data);
		assignWithDefaults(this as StationPart, pick(data, 'hp', 'type'));
		this.hp ||= this.generic.hp;
	}

	public remove() {
		this.station.parts.delete(this);
		for (const connection of this.connections) {
			this.removePart(connection);
		}
	}
}
