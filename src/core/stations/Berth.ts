import type { Level } from '../Level';
import { Producer } from '../generic/production';
import type { ShipType } from '../generic/ships';
import { genericShips, shipTypes } from '../generic/ships';
import type { SerializedStationComponent, StationComponentOptions } from './StationComponent';
import { StationComponent } from './StationComponent';

export interface SerializedBerth extends SerializedStationComponent {
	productionID: ShipType;
	productionTime: number;
}

export class Berth extends StationComponent implements Producer {
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

	toJSON(): SerializedBerth {
		return Object.assign(super.toJSON(), {
			productionID: this.productionID,
			productionTime: this.productionTime,
		});
	}

	static FromJSON(data: SerializedBerth, level: Level): Berth {
		const berth = <Berth>super.FromJSON(data, level);
		berth.productionID = data.productionID;
		berth.productionTime = data.productionTime;
		return berth;
	}
}
