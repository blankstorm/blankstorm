import { assign } from '../utils';
import { Component, register } from './component';

interface Data {
	xp: number;

	points: number;
}

@register()
export class Experience extends Component<Data> implements Data {
	public xp: number;

	public points: number;

	public data(): Data {
		return {
			xp: this.xp,
			points: this.points,
		};
	}

	public from(data: Data): void {
		assign(this, data, ['xp', 'points']);
	}
}
