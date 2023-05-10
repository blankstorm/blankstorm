import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import $ from 'jquery';

import { version } from '../core/meta.js';
import { FolderMap, random, generate, isJSON } from '../core/utils.js';
import Ship from '../core/entities/Ship.js';
import Player from '../core/entities/Player.js';
import Planet from '../core/bodies/Planet.js';
import Level from '../core/Level.js';

import { alert } from './utils.js';
import Waypoint from './waypoint.js';
import { setPaused, eventLog, setCurrent } from './index.js';
import PlanetRenderer from './renderer/bodies/PlanetRenderer.js';
import * as listeners from './listeners.js';
import * as renderer from './renderer/index.js';
import fs from './fs.js';
import SaveListItem from './ui/save-list-item.js';

export class SaveMap extends FolderMap {
	#live = new Map();
	constructor(path) {
		super(path, fs, '.json');

		this._getMap(); // update properly
	}

	_getMap() {
		for (const [id, content] of super._getMap()) {
			if (!isJSON(content)) {
				continue;
			}

			const data = JSON.parse(content);

			if (!this.#live.has(id)) {
				new Save(data, this);
			}
		}
		return this.#live;
	}

	get(key) {
		const data = super.get(key);
		if (isJSON(data) && this.#live.has(key)) {
			const save = this.#live.get(key);
			save.data = JSON.parse(data);
		}
		return this.#live.get(key);
	}

	set(key, save) {
		this.#live.set(key, save);
		super.set(key, JSON.stringify(save.data));
	}
}

export class Save {
	#data;
	constructor(data, store) {
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
		let save = LiveSave.FromData(this.data);
		for (let waypoint of save.waypoints) {
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
	constructor(name, doNotGenerate) {
		super(name, doNotGenerate);
		for (let [id, listener] of Object.entries(listeners.core)) {
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

	play(store) {
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

	static FromData(saveData) {
		let save = new LiveSave(saveData.name, true);
		Level.FromData(saveData, save);
		return save;
	}

	static async CreateDefault(name, playerID, playerName) {
		const level = new LiveSave(name);

		await level.ready();

		for (let body of level.bodies.values()) {
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

		const fleet = ['mosquito', 'cillus'].map(type => new Ship(null, level, { type }));
		fleet[0].position.z += 4;
		const player = new Player(playerID, level, { fleet });
		player.name = playerName;
		player.position = new Vector3(0, 0, -1000).add(random.cords(50, true));
		player.rotation = new Vector3(0, 0, 0);
		player.addItems(generate.items(5000));

		return level;
	}
}
