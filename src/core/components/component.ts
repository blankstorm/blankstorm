export interface Component<TJSON = unknown> {
	readonly component: string;

	readonly id?: string;

	update?(): void;

	toJSON(): TJSON;

	fromJSON(data: TJSON): void;
}

export function isComponent(value: unknown): value is Component {
	return typeof value == 'object' && 'component' in value && typeof value.component == 'string';
}
