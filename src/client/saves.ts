import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import $ from 'jquery';
import { FolderMap, isJSON } from 'utilium';
import { Player } from '../core/entities/player';
import type { LevelJSON } from '../core/level';
import { Level } from '../core/level';
import { randomCords } from '../core/utils';
import { getCurrentLevel } from './client';
import { path } from './config';
import { createSaveListItem } from './ui/templates';
import { account } from './user';
import { alert, logger } from './utils';
const fs = $app.require('fs');

export class Save {
	protected _data: LevelJSON;

	public gui: JQuery<HTMLLIElement>;

	public constructor(data: LevelJSON) {
		this._data = data;

		set(this.id, this);

		this.gui = createSaveListItem(this);
	}

	public get id() {
		return this._data?.id;
	}

	public get data(): LevelJSON {
		if (folder.has(this.id)) {
			this._data = JSON.parse(folder.get(this.id));
		}
		return this._data;
	}

	public set data(data: LevelJSON) {
		this._data = data;
		const date = new Date(this._data.date);
		this._data.date = date.toJSON();
		this.gui.find('.date').text(date.toLocaleString());
		this.update();
	}

	protected update() {
		folder.set(this.id, JSON.stringify(this._data));
		set(this.id, this);
	}

	public load(): Level {
		this.update();
		logger.info('Loading level from save ' + this.id);
		return Level.FromJSON(this.data);
	}

	public remove() {
		remove(this.id);
		this.gui.remove();
	}
}

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
	player.position = new Vector3(0, 0, -1000).add(randomCords(50, true));
	player.rotation = Vector3.Zero();

	level.rootSystem = system;
	logger.log(`Created default level "${name}"`);
	return level;
}

let folder: FolderMap;
const map: Map<string, Save> = new Map();

export function init() {
	logger.debug('Initializing saves');
	const folderPath = path + '/saves';
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath);
	}
	folder = new FolderMap(folderPath, { fs, suffix: '.json' });
	for (const [id, content] of folder) {
		if (!isJSON(content)) {
			logger.debug('Skipping invalid save: ' + id);
			continue;
		}

		const data = JSON.parse(content);

		if (map.has(id)) {
			logger.debug('Skipping already initialized save: ' + id);
			continue;
		}

		logger.debug('Initializing save: ' + id);
		new Save(data);
	}
	logger.info('Loaded ' + map.size + ' saves');
}

export function get(id: string): Save {
	const data = folder.get(id);
	if (isJSON(data) && map.has(id)) {
		map.get(id)!.data = JSON.parse(data);
	}
	return map.get(id)!;
}

export function set(key: string, save: Save): void {
	folder.set(key, JSON.stringify(save.data));
	map.set(key, save);
}

export function has(key: string): boolean {
	return folder.has(key);
}

function remove(key: string): boolean {
	logger.debug('Deleteing save ' + key);
	folder.delete(key);
	return map.delete(key);
}

export { remove as delete };

/**
 * Writes a level to the save file
 */
export function flush(): void {
	const currentLevel = getCurrentLevel();
	$('#pause .save').text('Saving...');
	try {
		const save = get(currentLevel.id);
		save.data = currentLevel.toJSON();
		set(currentLevel.id, save);
		logger.debug('Saved level ' + currentLevel.id);
	} catch (err) {
		alert('Failed to save.');
		logger.error(err);
		throw err;
	}
	$('#pause .save').text('Save Game');
}
