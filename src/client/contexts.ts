import type { Account } from '@blankstorm/api';
import type { ClientSystem } from './ClientSystem';
import type { Player } from '../core/nodes/Player';
import type { LogLevel } from 'logzen';

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
	require: NodeJS.Require & (<M = any>(id: string) => M);
	getCliOptions(): Promise<CliOptions>;
}
