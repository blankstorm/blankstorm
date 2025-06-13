import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Component, CopyData } from 'deltablank/core/component.js';
import type { Entity, EntityConfig, EntityJSON } from 'deltablank/core/entity.js';
import { EntityWithComponents } from 'deltablank/core/entity.js';
import type { UUID } from 'node:crypto';
import type { InstancesFor } from 'utilium';
import { Combat, Container, Fleet, Owner, Waypoint, type CombatConfigJSON } from '../components';
import type { Producer, ProductionInfo, ResearchID } from '../data';
import { getRecipes, research } from '../data';
import _parts from '../data/station.json' with { type: 'json' };
import { logger } from '../utils';
import { shipConfigs, ships, type ShipType } from './ships';

interface ConnectionsMixin {
	connections: Connections;
	station: Station | null;
}

interface ConnectionsJSON {
	connections: (UUID | null)[];
	station: UUID | null;
}

interface ConnectionsConfig {
	station_part_type: string;
	connectors: {
		type?: string[];
		position: number[];
		rotation: number[];
	}[];
}

type Part = Entity<[Connections]> & ConnectionsMixin;

class Connections extends Component<ConnectionsMixin, ConnectionsJSON, ConnectionsConfig> {
	public _data: (Part | null)[] = [];

	public add(part: Part, thisConn: number, otherConn: number) {
		const thisConnector = this.config.connectors.at(thisConn),
			otherConnector = part.constructor.config.connectors.at(otherConn);
		if (!thisConnector) {
			throw new ReferenceError('Connector does not exist: ' + thisConn);
		}
		if (!otherConnector) {
			throw new ReferenceError('Sub-component connector does not exist' + otherConn);
		}

		this.entity.station?.parts.add(part);
		this._data[thisConn] = part;
		part.connections._data[otherConn] = this.entity;

		part.parent = this.entity;
		part.position = Vector3.FromArray(thisConnector.position); //.add(otherConnector.position);
		part.rotation = Vector3.FromArray(thisConnector.rotation); //.add(otherConnector.rotation);
	}

	public remove(part: Part | null) {
		if (!part) return;
		this._data[this._data.indexOf(part)] = null;
		part.connections._data[part.connections._data.indexOf(this.entity)] = null;
	}

	public removeAt(connector: number) {
		const component = this._data[connector];
		return this.remove(component);
	}

	setup(): ConnectionsMixin {
		return { connections: this, station: null };
	}

	toJSON(): ConnectionsJSON {
		return {
			connections: this._data.map(part => part?.id || null),
			station: this.entity.station?.id || null,
		};
	}

	load(data: EntityJSON & ConnectionsJSON): void {
		// TODO
	}

	dispose(): void {
		this.entity.station?.parts.delete(this.entity);
		for (const conn of this._data) {
			if (conn) conn.connections.remove(this.entity);
		}
	}
}

const components = [Fleet, Container, Owner, Combat, Connections] as const;

interface PartConfigJSON extends EntityConfig<[Fleet, Container, Owner, Connections]>, CombatConfigJSON {}

export type StationPartID = keyof typeof _parts;

export const stationConfigs = _parts satisfies Record<StationPartID, PartConfigJSON>;

/** Station and station part entity config type */
type SConfig<T extends Component[] = []> = EntityConfig<[...InstancesFor<typeof components>, ...T]>;

export class Station extends EntityWithComponents(...components, Waypoint) {
	static config = {
		max_items: 1e10,
		fleet: {
			max_ships: 9999,
			allow_nesting: false,
		},
		waypoint: {
			builtin: true,
			readonly: true,
			color: '#88ddff',
			icon: 'space-station',
		},
		hp: 100,
		hardpoints: [],
		is_hardpoint: false,
		station_part_type: 'core',
		connectors: [
			{ position: [0, 0, 0], rotation: [0, 0, 0] },
			{ position: [0, 0, 0], rotation: [0, 1.5708, 0] },
			{ position: [0, 0, 0], rotation: [0, 3.14159, 0] },
			{ position: [0, 0, 0], rotation: [0, 4.7124, 0] },
		],
	} satisfies SConfig<[Waypoint]>;

	public parts: Set<Part> = new Set();
}

export class Lab extends EntityWithComponents(CopyData, ...components) implements Producer<ResearchID> {
	static config = stationConfigs.lab satisfies SConfig<[CopyData]>;

	public production: ProductionInfo<ResearchID> = null;
	public canProduce = [...research.keys()];

	public onTick(): void {
		if (!this.production) return;
		this.production.time = Math.max(this.production.time - 1, 0);
		if (this.production.time != 0) return;
		this.production = null;
	}

	public research(id: ResearchID) {
		const recipe = getRecipes(id, 'lab')[0];
		if (!recipe) throw logger.error('Research does not exist: ' + id);
		this.production = { id, time: recipe.time };
	}
}

export class Warehouse extends EntityWithComponents(...components) {
	static config = stationConfigs.warehouse satisfies SConfig;
}

export class Shipyard extends EntityWithComponents(...components, CopyData) implements Producer<ShipType> {
	static config = stationConfigs.shipyard satisfies SConfig<[CopyData]>;

	public production: ProductionInfo<ShipType> = null;
	public canProduce = Object.keys(shipConfigs) as ShipType[];

	public onTick(): void {
		if (!this.production) return;

		this.production.time = Math.max(this.production.time - 1, 0);
		if (this.production.time != 0) return;

		const ship = new ships[this.production.id](undefined, this.level);
		ship.position = this.absolutePosition;
		this.fleet.add(ship);
		this.production = null;
	}

	public build(id: ShipType) {
		const ship = ships[id];
		const recipe = getRecipes(id, 'shipyard')[0];
		if (!ship || !recipe) throw logger.error('Ship does not exist: ' + id);

		this.production = { id, time: recipe.time };
	}
}
