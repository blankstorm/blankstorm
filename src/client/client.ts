import { Log } from '../core/Log';
import type { SerializedSystem } from '../core/System';
import type { GenericProjectile } from '../core/generic/hardpoints';
import type { ItemCollection, ItemID } from '../core/generic/items';
import type { SerializedNode } from '../core/nodes/Node';
import { ClientLevel } from './ClientLevel';
import { SaveMap } from './Save';
import { ServerMap } from './Server';
import type { PlayerContext } from './contexts';
import { config, version } from '../core/metadata';
import { Keybind, settings } from './settings';
import { alert, fixPaths, minimize } from './utils';
import * as renderer from '../renderer/index';
import * as ui from './ui/ui';
import { playsound } from './audio';
import { Player } from '../core/nodes/Player';
import { ClientSystem } from './ClientSystem';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { ScreenshotUI } from './ui/screenshot';
import { locales, Locale } from './locales';
const fs = app.require('fs');

interface ClientPlayerContext extends PlayerContext {
	/**
	 * @internal
	 */
	_client: Client;
}

export interface ClientContext {
	log: Log;
	startPlaying(level: ClientLevel): boolean;
	stopPlaying(level: ClientLevel): boolean;
	saves: SaveMap;
	servers: ServerMap;
	sendChatMessage(...msg: string[]): unknown;
	get current(): ClientLevel;
	set current(current: ClientLevel);
	player: PlayerContext;
	ui: ui.Context;
}

export class Client implements ClientContext {
	public readonly log: Log = new Log();
	protected _saves: SaveMap;
	public get saves(): SaveMap {
		return this._saves;
	}
	protected _servers: ServerMap;
	public get servers(): ServerMap {
		return this._servers;
	}
	public readonly ui: ui.Context;
	protected _current: ClientLevel;
	public get current(): ClientLevel {
		return this._current;
	}
	public set current(value: ClientLevel) {
		this._current = value;
	}
	protected _player: ClientPlayerContext = {
		_client: this,
		id: '_guest_',
		username: '[guest]',
		oplvl: 0,
		lastchange: undefined,
		created: undefined,
		disabled: false,
		chat(...msg) {
			for (const m of msg) {
				this._client.sendChatMessage(`${this.username} = ${m}`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'));
			}
		},
		data() {
			const level = this._client.current.isServer ? this._client.servers.get(this._client.servers.selected).level : this._client.current;
			const player = level?.getNodeSystem(this.id)?.nodes?.get(this.id);
			return player as unknown as Player;
		},
		get system(): ClientSystem {
			return this._client.current?.getNodeSystem(this._client.current.activePlayer);
		},
	};
	public get player(): PlayerContext {
		this._player._client = this;
		return this._player;
	}
	public set player(value: PlayerContext) {
		const player = value as ClientPlayerContext;
		this._player = player;
	}

	protected _isPaused: boolean;
	public get isPaused(): boolean {
		return this._isPaused;
	}

	protected _isInitialized = false;
	public get isInitialized(): boolean {
		return this._isInitialized;
	}

	/**
	 * @param path The path to the client's data directory
	 */
	constructor(public readonly path: string) {}

	public flushSave() {
		if (!(this.current instanceof ClientLevel)) {
			throw 'Save Error: you must have a valid save selected.';
		}
		$('#pause .save').text('Saving...');
		try {
			const save = this.saves.get(this.current.id);
			save.data = this.current.toJSON();
			this.saves.set(this.current.id, save);
			this.sendChatMessage('Game saved.');
		} catch (err) {
			this.sendChatMessage('Failed to save game.');
			throw err;
		}
		$('#pause .save').text('Save Game');
	}

	public toggleChatUI(command?: boolean) {
		$('#chat,#chat-history').toggle();
		if ($('#chat-input').toggle().is(':visible')) {
			renderer.getCamera().detachControl();
			$('#chat-input').trigger('focus');
			if (command) {
				$('#chat-input').val('/');
			}
		} else {
			$('canvas.game').trigger('focus');
		}
	}

	public changeUI(selector: string, hideAll?: boolean) {
		if ($(selector).is(':visible')) {
			$('canvas.game').trigger('focus');
			$(selector).hide();
		} else if ($('.game-ui').not(selector).is(':visible') && hideAll) {
			$('canvas.game').trigger('focus');
			$('.game-ui').hide();
		} else if (!$('.game-ui').is(':visible')) {
			renderer.getCamera().detachControl();
			$(selector).show().trigger('focus');
		}
	}

	private _initLog(message: string): void {
		$('#loading_cover p').text(message);
		this.log.log('init: ' + message);
	}

	async init() {
		this._initLog('Initializing...');
		if (this._isInitialized) {
			this.log.warn('Tried to initialize context that is already initialized.');
			return;
		}

		const canvas = $<HTMLCanvasElement>('canvas.game');

		this._initLog('Loading saves...');
		if (!fs.existsSync(this.path + '/saves')) {
			fs.mkdirSync(this.path + '/saves');
		}
		this._saves = new SaveMap(this.path + '/saves', this);

		this._initLog('Loading servers...');
		this._servers = new ServerMap(this.path + '/servers.json', this);

		this._initLog('Initializing settings...');
		settings.items.get('forward').addEventListener('trigger', () => {
			renderer.getCamera().addVelocity(Vector3.Forward());
		});
		settings.items.get('left').addEventListener('trigger', () => {
			renderer.getCamera().addVelocity(Vector3.Left());
		});
		settings.items.get('right').addEventListener('trigger', () => {
			renderer.getCamera().addVelocity(Vector3.Right());
		});
		settings.items.get('back').addEventListener('trigger', () => {
			renderer.getCamera().addVelocity(Vector3.Backward());
		});
		settings.items.get('chat').addEventListener('trigger', e => {
			e.preventDefault();
			this.toggleChatUI();
		});
		settings.items.get('command').addEventListener('trigger', e => {
			e.preventDefault();
			this.toggleChatUI(true);
		});
		settings.items.get('toggle_menu').addEventListener('trigger', () => {
			// not implemented
		});
		settings.items.get('toggle_map').addEventListener('trigger', () => {
			this.changeUI('#map');
		});
		settings.items.get('toggle_temp_menu').addEventListener('trigger', () => {
			this.changeUI('#ingame-temp-menu');
		});
		settings.items.get('screenshot').addEventListener('trigger', () => {
			new ScreenshotUI(canvas[0].toDataURL('image/png'));
		});
		settings.items.get('save').addEventListener('trigger', e => {
			e.preventDefault();
			this.flushSave();
		});
		$('#map,#map-markers').on('keydown', e => {
			const speed = e.shiftKey ? 100 : 10,
				max = config.system_generation.max_size / 2;
			switch (e.key) {
				case settings.get<Keybind>('map_move_left').key:
					this.ui.map.x = Math.max(this.ui.map.x - speed, -max);
					break;
				case settings.get<Keybind>('map_move_right').key:
					this.ui.map.x = Math.min(this.ui.map.x + speed, max);
					break;
				case settings.get<Keybind>('map_move_up').key:
					this.ui.map.y = Math.max(this.ui.map.y - speed, -max);
					break;
				case settings.get<Keybind>('map_move_down').key:
					this.ui.map.y = Math.min(this.ui.map.y + speed, max);
					break;
			}
			ui.update(this);
		});
		$('#map,#map-markers').on('wheel', ({ originalEvent: evt }: JQuery.TriggeredEvent & { originalEvent: WheelEvent }) => {
			this.ui.map.scale = Math.min(Math.max(this.ui.map.scale - Math.sign(evt.deltaY) * 0.1, 0.5), 5);
			ui.update(this);
		});

		this._initLog('Initializing locales...');
		locales.on('fetch', (locale: Locale) => {
			settings.items.get('locale').addOption(locale.language, locale.name);
		});
		await locales.init('locales/en.json');
		for (const [id, section] of settings.sections) {
			section.label = () => locales.text('menu.settings_section.' + id);
		}
		this._initLog('Loading Mods...');
		try {
			if (!fs.existsSync('mods')) {
				fs.mkdirSync('mods');
			}

			const mods = fs.readdirSync('mods');
			this.log.log('Loaded mods: ' + (mods.join('\n') || '(none)'));
		} catch (err) {
			const message = 'Failed to load mods: ' + fixPaths(err.stack);
			this.log.error(message);
			alert(message).then(() => !cliOptions['bs-debug'] && close());
		}

			this._initLog('Initalizing renderer...');
		try {
			await renderer.init(canvas[0], msg => {
				this._initLog(`Initalizing renderer: ${msg}`);
			});
		} catch (err) {
			const message = 'Failed to initalize renderer: ' + fixPaths(err.stack);
			this.log.error(message);
			alert(message).then(() => !cliOptions['bs-debug'] && close());
		}
		ui.init(this);

		this._isInitialized = true;
	}

	async reload() {
		ui.update(this);
	}

	pause() {}

	unpause() {}

	startPlaying(level: ClientLevel): boolean {
		if (level.version != version) {
			alert('Incompatible version');
			return false;
		}

		$('#save-list,#server-list').hide();
		$('canvas.game').show().trigger('focus');
		$('#hud').show();
		this.current = level;
		renderer.clear();
		renderer.update(this.player.system.toJSON());
		level.on('projectile.fire', async (hardpointID: string, targetID: string, projectile: GenericProjectile) => {
			renderer.fireProjectile(hardpointID, targetID, projectile);
		});
		level.on('system.tick', async (system: SerializedSystem) => {
			if (this.player.system.id == system.id) {
				renderer.update(system);
			}
		});
		level.on('player.levelup', async () => {
			this.log.debug('Triggered player.levelup (unimplemented)');
		});
		level.on('player.death', async () => {
			renderer.getCamera().reset();
		});
		level.on('entity.follow_path.start', async (entityID: string, path: number[][]) => {
			renderer.startFollowingPath(entityID, path);
		});
		level.on('entity.death', async (node: SerializedNode) => {
			if (node.nodeType == 'ship') {
				playsound('destroy_ship', +settings.get('sfx'));
			}
		});
		level.on('player.items.change', async (player, items: ItemCollection) => {
			for (const [id, amount] of Object.entries(items) as [ItemID, number][]) {
				$(this.ui.items.get(id)).find('.count').text(minimize(amount));
			}
		});
		this._isPaused = false;

		return true;
	}

	stopPlaying(level: ClientLevel): boolean {
		for (const event of ['projectile.fire', 'level.tick', 'player.levelup', 'player.death', 'entity.follow_path.start', 'entity.death', 'player.items.change']) {
			level.off(event);
		}
		this._isPaused = true;
		return true;
	}

	setInitText(text: string): void {
		$('#loading_cover p').text(text);
		this.log.log('init: ' + text);
	}

	sendChatMessage(...msg: string[]): void {
		for (const m of msg) {
			this.log.log(`(chat) ${m}`);
			$(`<li bg=none></li>`)
				.text(m)
				.appendTo('#chat')
				.fadeOut(1000 * +settings.get('chat_timeout'));
			$(`<li bg=none></li>`).text(m).appendTo('#chat-history');
		}
	}
}
