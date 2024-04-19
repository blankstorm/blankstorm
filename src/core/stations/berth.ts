import type { Level } from '../level';
import type { Producer } from '../generic/production';
import type { ShipType } from '../generic/ships';
import { genericShips, shipTypes } from '../generic/ships';
import type { StationPartJSON, StationPartOptions } from './part';
import { StationPart } from './part';
import { assignWithDefaults, pick } from 'utilium';
import { Ship } from '../entities/ship';

export interface BerthJSON extends StationPartJSON {
	productionID: ShipType;
	productionTime: number;
}

export class Berth extends StationPart implements Producer {
	public productionID: ShipType;
	public productionTime: number;
	public canProduce = shipTypes;
	public constructor(id: string, level: Level, options: StationPartOptions) {
		super(id, level, options);
	}

	public update(): void {
		super.update();
		this.productionTime = Math.max(this.productionTime - 1, 0);
		if (this.productionTime != 0 || !this.productionID) {
			return;
		}
		const ship = new Ship(null, this.level, this.productionID);
		ship.position = this.absolutePosition;
		ship.owner = this.station.owner;
		this.productionID = null;
		this.level.emit('ship_created', ship.toJSON());
	}

	public build(type: ShipType) {
		this.productionID = type;
		this.productionTime = +genericShips[type].productionTime;
	}

	public toJSON(): BerthJSON {
		return {
			...super.toJSON(),
			...pick(this, 'productionID', 'productionTime'),
		};
	}

	public fromJSON(data: BerthJSON, level: Level): void {
		super.fromJSON(data, level);
		assignWithDefaults(this, pick(data, 'productionID', 'productionTime'));
	}
}
