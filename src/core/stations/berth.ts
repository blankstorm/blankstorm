import type { Level } from '../level';
import type { Producer } from '../generic/production';
import type { ShipType } from '../generic/ships';
import { genericShips, shipTypes } from '../generic/ships';
import type { StationPartJSON, StationPartOptions } from './part';
import { StationPart } from './part';

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

	public build(type: ShipType) {
		this.productionID = type;
		this.productionTime = +genericShips[type].productionTime;
	}

	public toJSON(): BerthJSON {
		return {
			...super.toJSON(),
			productionID: this.productionID,
			productionTime: this.productionTime,
		};
	}

	public from(data: BerthJSON, level: Level): void {
		super.from(data, level);
		this.productionID = data.productionID;
		this.productionTime = data.productionTime;
	}
}
