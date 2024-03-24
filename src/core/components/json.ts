import { Component, register } from './component';

@register()
export class JSONValue<TData> extends Component<TData> {
	public value: TData;

	public data(): TData {
		return this.value;
	}

	public from(data: TData): void {
		this.value = data;
	}
}
