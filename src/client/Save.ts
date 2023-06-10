import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import $ from 'jquery';

import { version } from '../core/meta';
import { FolderMap, random, isJSON } from '../core/utils';
import { Ship } from '../core/entities/Ship';
import { Player } from '../core/entities/Player';

import { setPaused, eventLog, setCurrent } from './index';
import * as listeners from './listeners';
import * as renderer from '../renderer/index';
import fs from './fs';
import { SaveListItem } from './ui/save';
import type { ShipType } from '../core/generic/ships';
import type { LevelEvent } from '../core/events';
import { ClientLevel, SerializedClientLevel } from './ClientLevel';

export class SaveMap extends Map<string, Save> {
	_map: FolderMap;
	selected?: string;
	current?: LiveSave;
	activePlayer: string;
	constructor(path: string) {
		super();
		this._map = new FolderMap(path, fs, '.json');

		this._getMap(); // update properly
	}

	_getMap() {
		for (const [id, content] of this._map._map) {
			if (!isJSON(content)) {
				continue;
			}

			const data = JSON.parse(content);

			if (!super.has(id)) {
				new Save(data, this);
			}
		}
		return this;
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
	store: SaveMap;
	gui: JQuery<SaveListItem>;
	get activePlayer(): string {
		return this.store.activePlayer;
	}
	constructor(data: SerializedClientLevel, store: SaveMap) {
		this.#data = data;
		this.store = store;
		this.gui = $(new SaveListItem(this));
		if (store) {
			store.set(this.id, this);
		}
	}

	get id() {
		return this.#data?.id;
	}

	get data(): SerializedClientLevel {
		if (this.store._map.has(this.id)) {
			this.#data = JSON.parse(this.store._map.get(this.id));
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

		this.store._map.set(this.id, JSON.stringify(this.#data));
		this.store.set(this.id, this);
	}

	load(playerID: string): LiveSave {
		if (this.#data.activePlayer != playerID) {
			this.#data.entities.find(e => e.id == this.#data.activePlayer).id = playerID;
			this.#data.activePlayer = playerID;
		}
		this.updateData();
		return LiveSave.FromData(this.data);
	}

	remove() {
		if (this.store) this.store.delete(this.id);
		this.gui.remove();
	}
}

export class LiveSave extends ClientLevel {
	constructor(name: string) {
		super(name);
		for (const [id, listener] of Object.entries(listeners.core)) {
			this.addEventListener(
				id,
				(evt: LevelEvent) => {
					eventLog.push(evt);
					listener(evt);
				},
				{ passive: true }
			);
		}
	}

	play(store: SaveMap) {
		if (this.version == version) {
			$('#save-list').hide();
			$('canvas.game').show().trigger('focus');
			$('#hud').show();
			if (store) store.selected = this.id;
			setCurrent(this);
			renderer.clear();
			renderer.update(this.serialize());
			setPaused(false);
		} else {
			throw 'That save is not compatible with the current game version';
		}
	}

	static FromData(saveData: SerializedClientLevel) {
		const save = new LiveSave(saveData.name);
		ClientLevel.FromData(saveData, save);
		return save;
	}

	static async CreateDefault(name: string, playerID: string, playerName: string) {
		const level = new LiveSave(name);
		await level.ready();
		await level.generateSystem('Crash Site', Vector3.Zero());

		const fleet = ['mosquito', 'cillus'].map((type: ShipType) => new Ship(null, level, { type }));
		fleet[0].position.z += 4;
		const player = new Player(playerID, level, { fleet });
		player.name = playerName;
		player.position = new Vector3(0, 0, -1000).add(random.cords(50, true));
		player.rotation = new Vector3(0, 0, 0);
		level.activePlayer = player.id;
		return level;
	}
}
