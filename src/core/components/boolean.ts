import { Component, register } from './component';

@register()
export class BooleanValue extends Component<boolean> {
	public is: boolean;

	public data(): boolean {
		return this.is;
	}

	public from(data: boolean): void {
		this.is = data;
	}
}
