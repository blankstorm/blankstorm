import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import $ from 'jquery';

import { version } from '../core/meta';
import { FolderMap, random, isJSON } from '../core/utils';
import { Ship } from '../core/entities/Ship';
import { Player } from '../core/entities/Player';
import { Planet } from '../core/bodies/Planet';
import { Level } from '../core/Level';
import { SerializedLevel } from '../core/Level';

import { alert } from './utils';
import { Waypoint } from './waypoint';
import { setPaused, eventLog, setCurrent } from './index';
import PlanetRenderer from '../renderer/bodies/Planet';
import * as listeners from './listeners';
import * as renderer from '../renderer/index';
import fs from './fs';
import SaveListItem from './ui/save-list-item';
import type { ShipType } from '../core/generic/ships';

export class SaveMap extends Map<string, Save> {
	#map: FolderMap;
	selected?: string;
	constructor(path: string) {
		super();
		this.#map = new FolderMap(path, fs, '.json');

		this._getMap(); // update properly
	}

	_getMap() {
		for (const [id, content] of this.#map._map) {
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
		const data = this.#map.get(id);
		if (isJSON(data) && super.has(id)) {
			const save = super.get(id);
			save.data = JSON.parse(data);
		}
		return super.get(id);
	}

	set(key: string, save: Save): this {
		this.#map.set(key, JSON.stringify(save.data));
		return super.set(key, save);
	}
}

export class Save {
	#data: SerializedLevel;
	store: SaveMap;
	gui: JQuery<SaveListItem>;
	constructor(data: SerializedLevel, store: SaveMap) {
		this.#data = data;
		this.store = store;
		this.gui = $(new SaveListItem(this));
		if (store) {
			store.set(this.data.id, this);
		}
	}

	get id() {
		return this.data?.id;
	}

	get data() {
		return this.#data;
	}

	set data(data) {
		const date = new Date(data.date);
		this.gui.find('.date').text(date.toLocaleString());
		this.#data = data;
	}

	load() {
		const save = LiveSave.FromData(this.data);
		for (const waypoint of save.waypoints) {
			new Waypoint(
				{
					id: waypoint.id,
					name: waypoint.name,
					color: Color3.FromArray(waypoint.color),
					position: Vector3.FromArray(waypoint.position),
				},
				save
			);
		}
		return save;
	}

	remove() {
		if (this.store) this.store.delete(this.data.id);
		this.gui.remove();
	}
}

export class LiveSave extends Level {
	waypoints = [];
	constructor(name: string, doNotGenerate?: boolean) {
		super(name, doNotGenerate);
		for (const [id, listener] of Object.entries(listeners.core)) {
			this.addEventListener(
				id,
				evt => {
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
			$('canvas.game').show().focus();
			$('#hud').show();
			if (store) store.selected = this.id;
			setCurrent(this);
			renderer.clear();
			renderer.update(this.serialize());
			renderer.engine.resize();
			setPaused(false);
		} else {
			alert('That save is in compatible with the current game version');
		}
	}

	static FromData(saveData: SerializedLevel) {
		const save = new LiveSave(saveData.name, true);
		Level.FromData(saveData, save);
		return save;
	}

	static async CreateDefault(name: string, playerID: string, playerName: string) {
		const level = new LiveSave(name);

		await level.ready();

		for (const body of level.bodies.values()) {
			body.waypoint = new Waypoint(
				{
					name: body.name,
					position: body.position,
					color: Color3.FromHexString('#88ddff'),
					icon: PlanetRenderer.biomes.has(body.biome) && body instanceof Planet ? PlanetRenderer.biomes.get(body.biome).icon : 'planet-ringed',
					readonly: true,
				},
				level
			);
		}

		const fleet = ['mosquito', 'cillus'].map((type: ShipType) => new Ship(null, level, { type }));
		fleet[0].position.z += 4;
		const player = new Player(playerID, level, { fleet });
		player.name = playerName;
		player.position = new Vector3(0, 0, -1000).add(random.cords(50, true));
		player.rotation = new Vector3(0, 0, 0);

		return level;
	}
}
