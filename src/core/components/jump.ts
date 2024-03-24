import { Vector2 } from '@babylonjs/core/Maths/math.vector';
import type { System } from '../System';
import { Component, register } from './component';
import { assign } from '../utils';

interface Data {
	cooldown: number;
	range: number;
	last?: number;
	target?: string;
}

@register()
export class Jump extends Component<Data> implements Data {
	public cooldown: number;

	public range: number;

	public last: number = 0;

	public target?: string;

	public to(target: System) {
		if (this.last < this.cooldown) {
			return false;
		}

		const distance = Vector2.Distance(this._.system.position, target.position);

		if (distance > this.range) {
			return false;
		}

		this.target = target.id;
		this.last = 0;
	}

	public data(): Data {
		return {
			cooldown: this.cooldown,
			range: this.range,
			last: this.last,
			target: this.target,
		};
	}

	public from(data: Data): void {
		assign(this, data, ['cooldown', 'range', 'last', 'target']);
	}
}
