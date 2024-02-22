import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import $ from 'jquery';

import { FolderMap, random, isJSON } from '../core/utils';
import { Ship } from '../core/nodes/Ship';
import { Player } from '../core/nodes/Player';

const fs = $app.require('fs');
import { SaveListItem } from './ui/save';
import type { ShipType } from '../core/generic/ships';
import { ClientLevel } from './level';
import type { SerializedClientLevel } from './level';
import { path } from './config';
import * as chat from './chat';
import { currentLevel } from './client';

export class Save {
	#data: SerializedClientLevel;

	gui: JQuery<SaveListItem>;
	get activePlayer(): string {
		return activePlayer;
	}
	constructor(data: SerializedClientLevel) {
		this.#data = data;

		set(this.id, this);

		this.gui = $(new SaveListItem(this));
	}

	get id() {
		return this.#data?.id;
	}

	get data(): SerializedClientLevel {
		if (folder.has(this.id)) {
			this.#data = JSON.parse(folder.get(this.id));
		}
		return this.#data;
	}

	set data(data: SerializedClientLevel) {
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

	load(playerID: string): LiveSave {
		if (this.#data.activePlayer != playerID) {
			this.#data.systems.find(system => system.nodes.some(node => node.id == this.#data.activePlayer)).nodes.find(node => node.id == this.#data.activePlayer).id = playerID;
			this.#data.activePlayer = playerID;
		}
		this.updateData();
		return LiveSave.FromJSON(this.data);
	}

	remove() {
		remove(this.id);
		this.gui.remove();
	}
}

export class LiveSave extends ClientLevel {
	constructor(name: string) {
		super(name);
	}

	static FromJSON(saveData: SerializedClientLevel) {
		const save = new LiveSave(saveData.name);
		ClientLevel.FromJSON(saveData, save);
		return save;
	}

	static async CreateDefault(name: string, playerID: string, playerName: string) {
		const level = new LiveSave(name);
		await level.ready();
		const system = await level.generateSystem('Crash Site', Vector2.Zero());
		const fleet = ['mosquito', 'cillus'].map((type: ShipType) => new Ship(null, system, { type }));
		fleet[0].position.z += 4;
		const player = new Player(playerID, system, { fleet });
		player.name = playerName;
		player.position = new Vector3(0, 0, -1000).add(random.cords(50, true));
		player.rotation = new Vector3(0, 0, 0);
		level.activePlayer = player.id;
		level.rootSystem = system;
		return level;
	}
}

export let selected: string;
export function select(id: string): void {
	selected = id;
}

export let current: LiveSave;
export let activePlayer: string;

let folder: FolderMap;
const map: Map<string, Save> = new Map();

export function init() {
	const folderPath = path + '/saves';
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath);
	}
	folder = new FolderMap(folderPath, fs, '.json');
	for (const [id, content] of folder._map) {
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
	if (!(currentLevel instanceof ClientLevel)) {
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
