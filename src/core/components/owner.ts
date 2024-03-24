import type { Entity } from '../entities/Entity';
import { Component, register } from './component';

@register()
export class Owner extends Component<string> {
	public owner: Entity;

	public data(): string {
		return this.owner.id;
	}

	public from(id: string): void {
		this.owner = this._.level.getEntityByID(id);
	}
}
