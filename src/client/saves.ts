import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import $ from 'jquery';

import { FolderMap, isJSON, randomCords } from '../core/utils';
import { Ship } from '../core/entities/ship';
import { Player } from '../core/entities/player';

const fs = $app.require('fs');
import { SaveListItem } from './ui/save';
import type { ShipType } from '../core/generic/ships';
import { path } from './config';
import * as chat from './chat';
import { currentLevel } from './client';
import type { LevelJSON } from '../core/level';
import { Level } from '../core/level';
import { account } from './user';

export class Save {
	#data: LevelJSON;

	gui: JQuery<SaveListItem>;

	constructor(data: LevelJSON) {
		this.#data = data;

		set(this.id, this);

		this.gui = $(new SaveListItem(this));
	}

	get id() {
		return this.#data?.id;
	}

	get data(): LevelJSON {
		if (folder.has(this.id)) {
			this.#data = JSON.parse(folder.get(this.id));
		}
		return this.#data;
	}

	set data(data: LevelJSON) {
		this.#data = data;
		this.updateData();
	}

	protected updateData() {
		const date = new Date(this.#data.date);
		this.#data.date = date.toJSON();
		this.gui.find('.date').text(date.toLocaleString());

		folder.set(this.id, JSON.stringify(this.#data));
		set(this.id, this);
	}

	load(): Level {
		this.updateData();
		return Level.From(this.data);
	}

	remove() {
		remove(this.id);
		this.gui.remove();
	}
}

export async function createDefault(name: string): Promise<Level> {
	const level = new Level();
	level.name = name;
	await level.ready();
	const system = await level.generateSystem('Kurassh', Vector2.Zero());
	const fleet = ['mosquito', 'cillus'].map((type: ShipType) => new Ship(null, level, { type }));
	fleet[0].position.z += 4;
	const player = new Player(account.id, level, { fleet });
	player.name = account.username;
	player.position = new Vector3(0, 0, -1000).add(randomCords(50, true));
	player.rotation = Vector3.Zero();
	level.rootSystem = system;
	return level;
}

let folder: FolderMap;
const map: Map<string, Save> = new Map();

export function init() {
	const folderPath = path + '/saves';
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath);
	}
	folder = new FolderMap(folderPath, fs, '.json');
	for (const [id, content] of folder) {
		if (!isJSON(content)) {
			continue;
		}

		const data = JSON.parse(content);

		if (!map.has(id)) {
			new Save(data);
		}
	}
}

export function get(id: string): Save {
	const data = folder.get(id);
	if (isJSON(data) && map.has(id)) {
		const save = map.get(id);
		save.data = JSON.parse(data);
	}
	return map.get(id);
}

export function set(key: string, save: Save): void {
	folder.set(key, JSON.stringify(save.data));
	map.set(key, save);
}

export function has(key: string): boolean {
	return folder.has(key);
}

export function clear(): void {
	folder.clear();
	return map.clear();
}

function remove(key: string): boolean {
	folder.delete(key);
	return map.delete(key);
}

export { remove as delete };

export function flush(): void {
	if (!(currentLevel instanceof Level)) {
		throw 'You must have a valid save selected.';
	}
	$('#pause .save').text('Saving...');
	try {
		const save = get(currentLevel.id);
		save.data = currentLevel.toJSON();
		set(currentLevel.id, save);
		chat.sendMessage('Game saved.');
	} catch (err) {
		chat.sendMessage('Failed to save game.');
		throw err;
	}
	$('#pause .save').text('Save Game');
}
