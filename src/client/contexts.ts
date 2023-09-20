import type { Account } from '@blankstorm/api';
import type { Log } from '../core/Log';
import type { ClientLevel } from './ClientLevel';
import type { ClientSystem } from './ClientSystem';
import type { SaveMap } from './Save';
import type { ServerMap } from './Server';
import type { Player } from '../core';

export interface PlayerContext extends Account {
	system: ClientSystem;
	chat(...msg: string[]): unknown;
	data(): Player;
}

export interface ClientContext {
	log: Log;
	startPlaying(level: ClientLevel): boolean;
	stopPlaying(level: ClientLevel): boolean;
	saves: SaveMap;
	servers: ServerMap;
	sendChatMessage(...msg: string[]): unknown;
	get current(): ClientLevel;
	set current(current: ClientLevel);
	player: PlayerContext;
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
