import type { Log } from '../core/Log';
import type { ClientLevel } from './ClientLevel';
import type { ClientSystem } from './ClientSystem';
import type { SaveMap } from './Save';
import type { ServerMap } from './Server';

export interface ClientContext {
	log: Log;
	startPlaying(level: ClientLevel): boolean;
	stopPlaying(level: ClientLevel): boolean;
	get saves(): SaveMap;
	get servers(): ServerMap;
	chat(...msg: string[]): unknown;
	get current(): ClientLevel;
	set current(current: ClientLevel);
	get playerSystem(): ClientSystem;
	get playerID(): string;
	[key: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface MarkerContext {
	x: number;
	y: number;
	get svgX(): number;
	get svgY(): number;
	rotation: number;
	scale: number;
	client: ClientContext;
}
