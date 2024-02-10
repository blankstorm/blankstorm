import type { Account } from '@blankstorm/api';
import type { ClientSystem } from './system';
import type { Player } from '../core/nodes/Player';
import type { IOMessage, LogLevel } from 'logzen';

export interface PlayerContext extends Account {
	system: ClientSystem;
	chat(...msg: string[]): unknown;
	data(): Player;
}

export interface CliOptions {
	'bs-debug': boolean;
	'bs-open-devtools': boolean;
	'log-level': LogLevel;
}

export interface AppContext {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	require: NodeJS.Require & (<M = any>(id: string) => M);
	getCliOptions(): Promise<CliOptions>;
	log(message: IOMessage): Promise<void>;
}
