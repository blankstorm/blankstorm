import type { Entity } from '../entities/Entity';
import { Component, register } from './component';

interface Data {
	hp: number;
	isTargetable?: boolean;
	power: number;
}

export interface Combatant {
	readonly power: number;
}

export interface Target<TComponents extends { combat: Combat } = { combat: Combat }> {
	combatant: Entity<TComponents>;
}

@register()
export class Combat extends Component<Data> implements Data, Combatant {
	public hp: number;

	public isTargetable: boolean = false;

	public power: number;

	public data(): Data {
		return {
			hp: +this.hp.toFixed(3),
			isTargetable: this.isTargetable,
			power: +this.power.toFixed(3),
		};
	}

	public from({ hp, isTargetable, power }: Data): void {
		this.hp = hp;
		this.isTargetable = isTargetable ?? true;
		this.power = power;
	}
}
