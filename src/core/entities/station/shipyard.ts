import { assignWithDefaults, pick } from 'utilium';
import { Ship } from '../ship.js';
import type { Producer, ProductionInfo } from '../../generic/production.js';
import type { ShipType } from '../../generic/ships.js';
import { genericShips } from '../../generic/ships.js';
import type { StationPartJSON } from './part.js';
import { StationPart } from './part.js';
import { logger } from '../../utils.js';

export interface ShipyardJSON extends StationPartJSON {
	production: ProductionInfo<ShipType>;
}

export class Shipyard extends StationPart implements Producer<ShipType> {
	public readonly type = 'shipyard' as const;

	public production: ProductionInfo<ShipType> = null;
	public canProduce = [...genericShips.keys()];

	public update(): void {
		super.update();
		if (!this.production) {
			return;
		}
		this.production.time = Math.max(this.production.time - 1, 0);
		if (this.production.time != 0) {
			return;
		}
		const ship = new Ship(undefined, this.system, this.production.id);
		ship.position = this.absolutePosition;
		this.fleet.add(ship);
		this.production = null;
	}

	public build(id: ShipType) {
		const ship = genericShips.get(id);
		if (!ship) {
			throw logger.error('Ship does not exist: ' + id);
		}
		this.production = {
			id,
			time: ship.productionTime,
		};
	}

	public toJSON(): ShipyardJSON {
		return {
			...super.toJSON(),
			...pick(this, 'production'),
		};
	}

	public fromJSON(data: ShipyardJSON): void {
		super.fromJSON(data);
		assignWithDefaults(this as Shipyard, pick(data, 'production'));
	}
}
