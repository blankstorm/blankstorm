import type { Level } from '../Level';
import { Producer } from '../generic/production';
import type { ShipType } from '../generic/ships';
import { genericShips, shipTypes } from '../generic/ships';
import type { StationComponentOptions } from './StationPart';
import { StationPart } from './StationPart';

export class Berth extends StationPart implements Producer {
	productionID: ShipType;
	productionTime: number;
	canProduce = shipTypes;
	constructor(id: string, level: Level, options: StationComponentOptions) {
		super(id, level, options);
	}

	build(type: ShipType) {
		this.productionID = type;
		this.productionTime = +genericShips[type].productionTime;
	}
}
