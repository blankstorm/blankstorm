import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import $ from 'jquery';

import { FolderMap, random, isJSON } from '../core/utils';
import { Ship } from '../core/nodes/Ship';
import { Player } from '../core/nodes/Player';

const fs = app.require('fs');
import { SaveListItem } from './ui/save';
import type { ShipType } from '../core/generic/ships';
import { ClientLevel } from './level';
import type { SerializedClientLevel } from './level';
import type { Client } from './client';

export class SaveMap extends Map<string, Save> {
	_map: FolderMap;
	selected?: string;
	current?: LiveSave;
	activePlayer: string;
	constructor(path: string, public readonly client: Client) {
		super();
		this._map = new FolderMap(path, fs, '.json');
	}

	init() {
		for (const [id, content] of this._map._map) {
			if (!isJSON(content)) {
				continue;
			}

			const data = JSON.parse(content);

			if (!super.has(id)) {
				new Save(data, this.client);
			}
		}
	}

	get(id: string): Save {
		const data = this._map.get(id);
		if (isJSON(data) && super.has(id)) {
			const save = super.get(id);
			save.data = JSON.parse(data);
		}
		return super.get(id);
	}

	set(key: string, save: Save): this {
		this._map.set(key, JSON.stringify(save.data));
		return super.set(key, save);
	}

	has(key: string): boolean {
		return this._map.has(key);
	}

	clear(): void {
		this._map.clear();
		return super.clear();
	}

	delete(key: string): boolean {
		this._map.delete(key);
		return super.delete(key);
	}
}

export class Save {
	#data: SerializedClientLevel;
	get store(): SaveMap {
		return this.client.saves;
	}
	gui: JQuery<SaveListItem>;
	get activePlayer(): string {
		return this.store.activePlayer;
	}
	constructor(data: SerializedClientLevel, public client: Client) {
		this.#data = data;
		if (client.saves) {
			client.saves.set(this.id, this);
		}
		this.gui = $(new SaveListItem(this, client));
	}

	get id() {
		return this.#data?.id;
	}

	get data(): SerializedClientLevel {
		if (this.client.saves._map.has(this.id)) {
			this.#data = JSON.parse(this.client.saves._map.get(this.id));
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

		this.client.saves._map.set(this.id, JSON.stringify(this.#data));
		this.client.saves.set(this.id, this);
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
		if (this.client.saves) this.client.saves.delete(this.id);
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
