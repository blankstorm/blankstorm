import type { ShipType } from '../generic/ships';
import type { Level } from '../Level';
import type { SerializedStationComponent, StationComponentOptions } from './StationComponent';
import { StationComponent } from './StationComponent';
import { genericShips, shipTypes } from '../generic/ships';
import { Producer } from '../generic/production';

export interface SerializedBerth extends SerializedStationComponent {
	productionID: ShipType;
	productionTime: number;
}

export class Berth extends StationComponent implements Producer {
	productionID: ShipType;
	productionTime: number;
	canProduce = shipTypes;
	constructor(id: string, level: Level, options: StationComponentOptions){
		super(id, level, options);
	}

	build(type: ShipType) {
		this.productionID = type;
		this.productionTime = +genericShips[type].productionTime;
	}

	serialize(): SerializedBerth {
		return Object.assign(super.serialize(), {
			productionID: this.productionID,
			productionTime: this.productionTime,
		});
	}

	static FromData(data: SerializedBerth, level: Level): Berth {
		const berth = super.FromData(data, level) as Berth;
		berth.productionID = data.productionID;
		berth.productionTime = data.productionTime;
		return berth;
	}
}