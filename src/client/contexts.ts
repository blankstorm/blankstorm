import type { Account } from '@blankstorm/api';
import type { ClientSystem } from './ClientSystem';
import type { Player } from '../core/nodes/Player';

export interface PlayerContext extends Account {
	system: ClientSystem;
	chat(...msg: string[]): unknown;
	data(): Player;
}

export interface CliOptions {
	'bs-debug': boolean;
	'bs-open-devtools': boolean;
}

export interface AppContext {
	require: typeof require;
	getCliOptions(): Promise<CliOptions>;
}
