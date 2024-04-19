export interface Component<TJSON = unknown> {
	id?: string;

	update?(): void;

	toJSON(): TJSON;

	fromJSON(data: TJSON): void;
}
