export interface Component<TData = unknown> {
	id?: string;

	update(): void;

	toJSON(): TData;

	fromJSON(data: TData): void;
}
