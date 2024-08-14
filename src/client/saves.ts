import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import $ from 'jquery';
import * as fs from 'node:fs';
import { isJSON } from 'utilium';
import { FolderMap } from 'utilium/fs.js';
import { Player } from '../core/entities/player';
import type { LevelJSON } from '../core/level';
import { Level } from '../core/level';
import { randomInSphere } from '../core/utils';
import { getCurrentLevel } from './client';
import { path } from './config';
import { createSaveListItem } from './ui/templates';
import { account } from './user';
import { logger } from './utils';
import { alert } from './ui/dialog';
import { versions } from '../core/metadata';

export async function createDefault(name: string): Promise<Level> {
	const level = new Level();
	level.name = name;
	await level.ready();
	const system = await level.generateSystem('Kurassh', Vector2.Zero());

	const player = new Player(account.id, level);
	player.fleet.addFromStrings('mosquito', 'cillus');
	player.fleet.at(0).position.z += 7.5;
	player.system = system;
	player.name = account.username;
	player.position = new Vector3(0, 0, -1000).add(randomInSphere(50, true));
	player.rotation = Vector3.Zero();

	level.rootSystem = system;
	logger.log(`Created default level "${name}"`);
	return level;
}

/**
 * Runtime stuff for a save
 */
export interface SaveData {
	gui: JQuery<HTMLLIElement>;
}

const runtimeData = new Map<string, SaveData>();

let saves: FolderMap;

export function init() {
	const folderPath = path + '/saves';
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath);
	}
	saves = new FolderMap(folderPath, { suffix: '.json' });
	for (const [id, content] of saves) {
		if (!isJSON(content)) {
			logger.debug('Skipping invalid save: ' + id);
			continue;
		}

		if (runtimeData.has(id)) {
			logger.debug('Skipping already initialized save: ' + id);
			continue;
		}

		logger.debug('Initializing save: ' + id);
		const save = JSON.parse(content);
		runtimeData.set(save.id, { gui: createSaveListItem(save) });
	}
	logger.info('Loaded ' + saves.size + ' saves');
}

export function get(id: string): LevelJSON {
	const data = saves.get(id);
	if (!isJSON(data)) {
		throw new TypeError('Cannot get invalid save: ' + id);
	}
	return JSON.parse(data);
}

export function add(save: LevelJSON): void {
	logger.debug('Added save: ' + save.id);
	if (saves.has(save.id)) {
		throw new ReferenceError('Can not add save because it already exists: ' + save.id);
	}
	runtimeData.set(save.id, { gui: createSaveListItem(save) });
	saves.set(save.id, JSON.stringify(save));
}

export function update(save: LevelJSON): void {
	const date = new Date();
	save.date = date.toJSON();
	const gui = runtimeData.get(save.id)?.gui;
	gui?.find('.name').text(save.name);
	gui?.find('.version').text(versions.get(save.version)?.text || save.version);
	gui?.find('.date').text(date.toLocaleString());
	saves.set(save.id, JSON.stringify(save));
}

export function has(id: string): boolean {
	return saves.has(id);
}

export function remove(save: string | LevelJSON): boolean {
	const id = typeof save == 'string' ? save : save.id;
	logger.debug('Deleteing save: ' + id);
	runtimeData.get(id)?.gui.remove();
	runtimeData.delete(id);
	return saves.delete(id);
}

export { remove as delete };

/**
 * Writes a level to the save file
 */
export function flush(): void {
	const currentLevel = getCurrentLevel();
	$('#pause .save').text('Saving...');
	try {
		update(currentLevel.toJSON());
		logger.debug('Writing save: ' + currentLevel.id);
	} catch (error: any) {
		alert('Failed to save.');
		logger.error(error);
		throw error;
	}
	$('#pause .save').text('Save Game');
}
