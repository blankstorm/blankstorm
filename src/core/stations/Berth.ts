import type { ShipType } from '../generic/ships';
import type { System } from '../System';
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
	constructor(id: string, system: System, options: StationComponentOptions) {
		super(id, system, options);
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

	static FromJSON(data: SerializedBerth, system: System): Berth {
		const berth = <Berth>super.FromJSON(data, system);
		berth.productionID = data.productionID;
		berth.productionTime = data.productionTime;
		return berth;
	}
}
