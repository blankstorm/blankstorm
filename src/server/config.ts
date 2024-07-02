import { writeFileSync } from 'node:fs';
import { List } from 'utilium';
import { config as coreConfig } from '../core';

// whitelist

export const whitelist = new List<string>();
whitelist.on('update', () => writeFileSync('whitelist.json', whitelist.json()));

// blacklist

export const blacklist = new List<string>();
blacklist.on('update', () => writeFileSync('blacklist.json', blacklist.json()));

//operators

export interface OpsEntry {
	bypassLimit: boolean;
	oplvl: number;
}

export const ops = new List<OpsEntry>();
ops.on('update', () => writeFileSync('ops.json', ops.json()));

export interface ServerConfig {
	whitelist: boolean;
	blacklist: boolean;
	max_clients: number;
	message: string;
	debug: boolean;
	port: number;
	public_uptime: boolean;
	public_log: boolean;
}

export let config: ServerConfig = {
	whitelist: false,
	blacklist: true,
	max_clients: 10,
	message: '',
	debug: false,
	public_log: false,
	public_uptime: false,
	port: coreConfig.default_port,
};
