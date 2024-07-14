import { assignWithDefaults, pick } from 'utilium';
import { Ship } from '../ship';
import type { Producer, ProductionInfo } from '~/core/generic/production';
import type { ShipType } from '~/core/generic/ships';
import { genericShips, shipTypes } from '~/core/generic/ships';
import type { StationPartJSON } from './part';
import { StationPart } from './part';

export interface BerthJSON extends StationPartJSON {
	production: ProductionInfo<ShipType>;
}

export class Berth extends StationPart implements Producer<ShipType> {
	public production: ProductionInfo<ShipType>;
	public canProduce = shipTypes;

	public update(): void {
		super.update();
		if (!this.production) {
			return;
		}
		this.production.time = Math.max(this.production.time - 1, 0);
		if (this.production.time != 0) {
			return;
		}
		const ship = new Ship(undefined, this.level, this.production.id);
		ship.position = this.absolutePosition;
		this.fleet.add(ship);
		this.production = null;
	}

	public build(id: ShipType) {
		this.production = {
			id,
			time: +genericShips[id].productionTime,
		};
	}

	public toJSON(): BerthJSON {
		return {
			...super.toJSON(),
			...pick(this, 'production'),
		};
	}

	public fromJSON(data: BerthJSON): void {
		super.fromJSON(data);
		assignWithDefaults(this as Berth, pick(data, 'production'));
	}
}
