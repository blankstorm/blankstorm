import type { Level } from '../../core/Level';

export interface UIContext {
	get level(): Level;
	get playerID(): string;
}
