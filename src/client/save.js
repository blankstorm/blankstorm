import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';

import 'jquery'; /* global $ */

import { version, versions, random, generate, Ship, Player, Planet, Level } from 'core';
import { modal, download, confirm, alert } from './utils.js';
import Waypoint from './waypoint.js';
import db from './db.js';
import { Playable } from './playable.js';
import { canvas, setPaused, mp, saves, eventLog } from './index.js';
import { update as updateUI } from './ui.js';
import PlanetRenderer from './renderer/bodies/PlanetRenderer.js';
import * as listeners from './listeners.js';
import * as renderer from './renderer/index.js';

export default class Save extends Playable {
	static GUI(save) {
		const gui = $(`<li ofn bg bw style=align-items:center;height:3em;></li>`);
		gui.delete = $(`<p style=position:absolute;left:10%><svg><use href=images/icons.svg#trash /></svg></p>`).appendTo(gui);
		gui.download = $(`<p style=position:absolute;left:15%><svg><use href=images/icons.svg#download /></svg></p>`).appendTo(gui);
		gui.play = $(`<p style=position:absolute;left:20%><svg><use href=images/icons.svg#play /></svg></p>`).appendTo(gui);
		gui.edit = $(`<p style=position:absolute;left:25%><svg><use href=images/icons.svg#pencil /></svg></p>`).appendTo(gui);
		gui.name = $(`<p style=position:absolute;left:30%>${save.data.name}</p>`).appendTo(gui);
		gui.version = $(`<p style=position:absolute;left:55%>${versions.get(save.data.version) ? versions.get(save.data.version).text : save.data.version}</p>`).appendTo(gui);
		gui.date = $(`<p style=position:absolute;left:65%>${new Date(save.data.date).toLocaleString()}</p>`).appendTo(gui);
		$('<p> </p>').appendTo(gui);

		let loadAndPlay = async () => {
			$('#loading_cover').show();
			let live = save.load();
			await live.ready();
			save.getStore().current = live;
			live.play();
			$('#loading_cover').hide();
		};

		gui.attr('clickable', '')
			.click(() => {
				$('.selected').removeClass('selected');
				save.getStore().selected = save.data.id;
				gui.addClass('selected');
			})
			.dblclick(loadAndPlay);
		if (!mp) gui.prependTo('#load');
		gui.delete.click(async e => {
			let remove = async () => {
				gui.remove();
				const tx = await db.tx('saves', 'readwrite');
				tx.objectStore('saves').delete(save.data.id);
				save.delete();
			};
			e.shiftKey ? remove() : confirm().then(remove);
		});
		gui.download.click(() => download(JSON.stringify(save.data), (save.data.name || 'save') + '.json'));
		gui.play.click(loadAndPlay);
		gui.edit.click(async () => {
			const result = await modal([{ name: 'name', placeholder: 'New name', value: save.data.name }], { Cancel: false, Save: true });
			if (result.result) {
				save.data.name = result.name;
				updateUI();
			}
		});
		return gui;
	}
	static Live = class extends Level {
		waypoints = [];
		constructor(name, doNotGenerate) {
			super(name, doNotGenerate);
			for (let [id, listener] of listeners.core) {
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
		play() {
			if (this.version == version) {
				$('#load').hide();
				canvas.show();
				canvas.focus();
				$('#hud').show();
				saves.selected = this.id;
				saves.current = this;
				renderer.clear();
				renderer.update(this.serialize());
				renderer.engine.resize();
				setPaused(false);
			} else {
				alert('That save is in compatible with the current game version');
			}
		}
		static Load(saveData) {
			let save = new Save.Live(saveData.name, true);
			Level.Load(saveData, save);
			return save;
		}
		static async CreateDefault(name, playerID, playerName) {
			const level = new Save.Live(name);

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

			const playerData = new Player({ id: playerID, name: playerName, position: new Vector3(0, 0, -1000).add(random.cords(50, true)), level });

			new Ship({ type: 'mosquito', owner: playerData, parent: playerData, level });
			new Ship({ type: 'cillus', owner: playerData, parent: playerData, level });
			playerData.fleet[0].position.z += 4;

			playerData.addItems(generate.items(5000));

			return level;
		}
	};
	constructor(data) {
		super(data.id, saves);
		try {
			this.data = data;
			this.gui = Save.GUI(this);
			saves.set(this.data.id, this);
		} catch (err) {
			console.error(err.stack);
		}
	}
	load() {
		let save = Save.Live.Load(this.data);
		for (let waypoint of save.waypoints) {
			new Waypoint({
				id: waypoint.id,
				name: waypoint.name,
				color: Color3.FromArray(waypoint.color),
				position: Vector3.FromArray(waypoint.position),
			});
		}
		return save;
	}
	async saveToDB() {
		let tx = await db.tx('saves', 'readwrite');
		tx.objectStore('saves').put(this.data, this.data.id);
		return tx.result;
	}
}
