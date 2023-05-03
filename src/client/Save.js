import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import $ from 'jquery';

import { version, versions, random, generate, Ship, Player, Planet, Level } from '../core/index.js';
import { modal, download, confirm, alert } from './utils.js';
import Waypoint from './waypoint.js';
import { Playable } from './playable.js';
import { canvas, setPaused, mp, saves, eventLog, setCurrent } from './index.js';
import { update as updateUI } from './ui.js';
import PlanetRenderer from './renderer/bodies/PlanetRenderer.js';
import * as listeners from './listeners.js';
import * as renderer from './renderer/index.js';
import fs from './fs.js';

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
			.on('click', () => {
				$('.selected').removeClass('selected');
				save.getStore().selected = save.data.id;
				gui.addClass('selected');
			})
			.dblclick(loadAndPlay);
		gui.prependTo('#save-list');
		gui.delete.on('click', async e => {
			let remove = async () => {
				gui.remove();
				if (fs.existsSync(save.path)) {
					fs.unlinkSync(save.path);
				}
				save.delete();
			};
			e.shiftKey ? remove() : confirm().then(remove);
		});
		gui.download.on('click', () => download(JSON.stringify(save.data), (save.data.name || 'save') + '.json'));
		gui.play.click(loadAndPlay);
		gui.edit.on('click', async () => {
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
				$('#save-list').hide();
				canvas.show();
				canvas.focus();
				$('#hud').show();
				saves.selected = this.id;
				setCurrent(this);
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
			Level.FromData(saveData, save);
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

			const fleet = ['mosquito', 'cillus'].map(type => new Ship(null, level, { type }));
			fleet[0].position.z += 4;
			const player = new Player(playerID, level, { fleet });
			player.name = playerName;
			player.position = new Vector3(0, 0, -1000).add(random.cords(50, true));
			player.rotation = new Vector3(0, 0, 0);
			player.addItems(generate.items(5000));

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

	get path() {
		return `saves/${this.data.id}.json`;
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

	saveToStorage() {
		if (!fs.existsSync('saves')) {
			fs.mkdirSync('saves');
		}

		fs.writeFileSync(this.path, JSON.stringify(this.data), { encoding: 'utf-8' });
	}
}
