import type { Level } from '../level';
import type { Producer } from '../generic/production';
import type { ShipType } from '../generic/ships';
import { genericShips, shipTypes } from '../generic/ships';
import type { StationPartJSON } from './part';
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
	public constructor(id: string, level: Level) {
		super(id, level);
	}

	public update(): void {
		super.update();
		this.productionTime = Math.max(this.productionTime - 1, 0);
		if (this.productionTime != 0 || !this.productionID) {
			return;
		}
		const ship = new Ship(null, this.level, this.productionID);
		ship.position = this.absolutePosition;
		this.fleet.add(ship);
		this.productionID = null;
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

	public fromJSON(data: BerthJSON): void {
		super.fromJSON(data);
		assignWithDefaults(this, pick(data, 'productionID', 'productionTime'));
	}
}
