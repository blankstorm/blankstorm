import type { EntityData } from '../entities/Entity';
import { Hardpoint } from '../entities/Hardpoint';
import { Component, register } from './component';

type Data = EntityData<Hardpoint>[];

@register()
export class Hardpoints extends Component<Data> {
	points: Set<Hardpoint>;

	public data(): Data {
		return [...this.points].map(hp => hp.toJSON());
	}

	public from(pointsData: Data): void {
		for (const pointData of pointsData) {
			const point = Hardpoint.FromJSON(pointData, this._.level);
			this.points.add(point);
		}
	}
}
