import type { ItemID } from '../generic/items';
import type { ResearchID } from '../generic/research';
import type { ShipType } from '../generic/ships';
import { assign } from '../utils';
import { Component, register } from './component';

export type ProductionID = ItemID | ResearchID | ShipType;

interface ProducerData {
	id: ProductionID;
	time: number;
}

@register()
export class Production extends Component<ProducerData> implements ProducerData {
	public id: ProductionID;

	public time: number;

	public canProduce: ProductionID[];

	public get isAvailable(): boolean {
		return true;
	}

	public data(): ProducerData {
		return {
			id: this.id,
			time: this.time,
		};
	}

	public from(data: ProducerData): void {
		assign(this, data, ['id', 'time']);
	}
}
