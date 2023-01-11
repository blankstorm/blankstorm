import { Vector3 } from '@babylonjs/core/Maths/math.vector.js';
import { Color3 } from '@babylonjs/core/Maths/math.color.js';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial.js';

import 'jquery'; /* global $ */

import { version, versions, random, generate, Ship, PlayerData, Planet, Level } from 'core';
import { modal, download } from './utils.js';
import Waypoint from './waypoint.js';
import db from './db.js';
import { Playable } from './playable.js';
import { updateUI, canvas, setPaused, mp, saves } from './index.js';

export default class Save extends Playable {
	static GUI = function (save) {
		const gui = $(`<li ofn bg bw style=align-items:center;height:3em;></li>`);
		gui.delete = $(`<p style=position:absolute;left:10%><svg><use href=images/icons.svg#trash /></svg></p>`).appendTo(gui);
		gui.download = $(`<p style=position:absolute;left:15%><svg><use href=images/icons.svg#download /></svg></p>`).appendTo(gui);
		gui.play = $(`<p style=position:absolute;left:20%><svg><use href=images/icons.svg#play /></svg></p>`).appendTo(gui);
		gui.edit = $(`<p style=position:absolute;left:25%><svg><use href=images/icons.svg#pencil /></svg></p>`).appendTo(gui);
		gui.name = $(`<p style=position:absolute;left:30%>${save.data.name}</p>`).appendTo(gui);
		gui.version = $(`<p style=position:absolute;left:55%>${versions.get(save.data.version) ? versions.get(save.data.version).text : save.data.version}</p>`).appendTo(gui);
		gui.date = $(`<p style=position:absolute;left:65%>${new Date(save.data.date).toLocaleString()}</p>`).appendTo(gui);
		$('<p> </p>').appendTo(gui);

		let loadAndPlay = async playerID => {
			$('#loading_cover').show();
			let live = save.load();
			await live.ready();
			save.getStore().current = live;
			live.play(live.playerData.get(playerID));
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
		gui.delete.click(e => {
			let remove = () => {
				gui.remove();
				db.tx('saves', 'readwrite').then(tx => {
					tx.objectStore('saves').delete(save.data.id);
					save.delete();
				});
			};
			e.shiftKey ? remove() : confirm().then(remove);
		});
		gui.download.click(() => download(JSON.stringify(save.data), (save.data.name || 'save') + '.json'));
		gui.play.click(loadAndPlay);
		gui.edit.click(() => {
			modal([{ name: 'name', placeholder: 'New name', value: save.data.name }], { Cancel: false, Save: true }).then(result => {
				if (result.result) {
					save.data.name = result.name;
					updateUI();
				}
			});
		});
		return gui;
	};
	static Live = class extends Level {
		waypoints = [];
		constructor(name, engine, doNotGenerate) {
			super(name, engine, doNotGenerate);
		}
		play(player) {
			if (this.version == version) {
				$('#load').hide();
				canvas.show().focus();
				$('#hud').show();
				this.getEngine().resize();
				saves.selected = this.id;
				setPaused(false);
				player ??= [...this.playerData][0];
				if (player instanceof PlayerData) {
					this.activeCamera = player.cam;
					player.cam.attachControl(canvas, true);
					player.cam.inputs.attached.pointers.buttons = [1];
					player.cam.target = player.position;
				}
			} else {
				alert('That save is in compatible with the current game version');
			}
		}
		static Load(saveData, engine) {
			let save = new Save.Live(saveData.name, true);
			Level.Load(saveData, engine, save);
			return save;
		}
		static async CreateDefault(name, playerID, playerName) {
			const save = new Save.Live(name);

			await save.ready();

			for (let body of save.bodies.values()) {
				body.waypoint = new Waypoint(
					{
						name: body.name,
						position: body.position,
						color: Color3.FromHexString('#88ddff'),
						icon: Planet.biomes.has(body.biome) && body instanceof Planet ? Planet.biomes.get(body.biome).icon : 'planet-ringed',
						readonly: true,
					},
					save
				);
			}

			const playerData = new PlayerData({ id: playerID, name: playerName, position: new Vector3(0, 0, -1000).add(random.cords(50, true)) }, save);
			playerData._customHardpointProjectileMaterials = [
				{
					applies_to: ['laser'],
					material: Object.assign(new StandardMaterial('player-laser-projectile-material', save), {
						emissiveColor: Color3.Teal(),
						albedoColor: Color3.Teal(),
					}),
				},
			];
			save.playerData.set(playerID, playerData);

			new Ship('mosquito', playerData, save);
			new Ship('cillus', playerData, save);
			playerData.addItems(generate.items(5000));

			save.addCamera(playerData.cam);
			save.activeCamera = playerData.cam;

			return save;
		}
	};
	constructor(data) {
		super(data.id, saves);
		try {
			this.data = data;
			this.gui = new Save.GUI(this);
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
