import type { ResearchID } from '../generic/research';
import { research } from '../generic/research';
import { Component, register } from './component';

type Data = Record<ResearchID, number>;

@register()
export class Research extends Component<Data> {
	public research = <Data>Object.fromEntries(Object.keys(research).map((k: ResearchID) => [k, 0]));

	public data(): Data {
		return this.research;
	}

	public from(data: Data): void {
		Object.assign(this.research, data);
	}
}
