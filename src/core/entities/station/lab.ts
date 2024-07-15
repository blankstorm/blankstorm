import { assignWithDefaults, pick } from 'utilium';
import type { Producer, ProductionInfo } from '~/core/generic/production';
import { research, type ResearchID } from '~/core/generic/research';
import type { StationPartJSON } from './part';
import { StationPart } from './part';

export interface LabJSON extends StationPartJSON {
	production: ProductionInfo<ResearchID>;
}

export class Lab extends StationPart implements Producer<ResearchID> {
	public readonly type = 'lab' as const;

	public production: ProductionInfo<ResearchID>;
	public canProduce = Object.keys(research) as ResearchID[];

	public update(): void {
		super.update();
		if (!this.production) {
			return;
		}
		this.production.time = Math.max(this.production.time - 1, 0);
		if (this.production.time != 0) {
			return;
		}
		this.production = null;
	}

	public research(id: ResearchID) {
		this.production = {
			id,
			time: +research[id].productionTime,
		};
	}

	public toJSON(): LabJSON {
		return {
			...super.toJSON(),
			...pick(this, 'production'),
		};
	}

	public fromJSON(data: LabJSON): void {
		super.fromJSON(data);
		assignWithDefaults(this as Lab, pick(data, 'production'));
	}
}
