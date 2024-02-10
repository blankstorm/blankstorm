import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Engine } from '@babylonjs/core/Engines/engine';
import { Account, getAccount } from '@blankstorm/api';
import $ from 'jquery';
import { config, version } from '../core/metadata';
import { Logger } from 'logzen';
import type { SerializedSystem } from '../core/System';
import type { GenericProjectile } from '../core/generic/hardpoints';
import type { ItemCollection, ItemID } from '../core/generic/items';
import type { SerializedNode } from '../core/nodes/Node';
import type { Player } from '../core/nodes/Player';
import { ClientLevel } from './level';
import { SaveMap } from './Save';
import { ServerMap } from './Server';
import type { AppContext, PlayerContext } from './contexts';
import { type Keybind, settings } from './settings';
import { alert, cookies, fixPaths, minimize } from './utils';
import type { ClientSystem } from './system';
import { Locale, locales } from './locales';
import { playsound } from './audio';
import * as renderer from '../renderer/index';
import * as ui from './ui/ui';
import { ScreenshotUI } from './ui/screenshot';
import { execCommandString } from '../core/commands';
import { CliOptions } from './contexts';

import { xpToLevel } from '../core/utils';

const fs = app.require<typeof import('fs')>('fs');
const appConsole = app.require<typeof import('console')>('console');

interface ClientPlayerContext extends PlayerContext {
	/**
	 * @internal
	 */
	_client: Client;
}

export interface ChatInfo {
	/**
	 * The index for which input is being shown
	 */
	index: number;

	/**
	 * The current, uncached input
	 */
	currentInput: string;

	/**
	 * array of previous inputs
	 */
	inputs: string[];

	/**
	 * Easter egg
	 */
	eggCounter: number;
}

export class Client {
	public readonly logger: Logger = new Logger();

	protected _saves: SaveMap;
	public get saves(): SaveMap {
		return this._saves;
	}

	protected _servers: ServerMap;
	public get servers(): ServerMap {
		return this._servers;
	}

	public readonly ui: ui.Context = ui.context;

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
		type: 0,
		lastchange: undefined,
		created: undefined,
		is_disabled: false,
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

	protected _isMultiplayerEnabled = false;
	public get isMultiplayerEnabled() {
		return this._isMultiplayerEnabled;
	}

	public hitboxesEnabled = false;

	public readonly screenshots = [];

	protected _mods = new Map();

	readonly chatInfo: ChatInfo = { index: 0, currentInput: '', inputs: [], eggCounter: 0 };

	protected _logPath: string;

	/**
	 * @param path The path to the client's data directory
	 */
	constructor(public readonly path: string, public readonly app: AppContext) {
		this.logger.attach(appConsole);
		if (!fs.existsSync(path + '/logs/')) {
			fs.mkdirSync(path + '/logs/', { recursive: true });
		}
		this._logPath = `${path}/logs/${new Date().toISOString()}.log`.replaceAll(':', '.');
		this.logger.on('entry', entry => {
			fs.appendFileSync(this._logPath, entry + '\n');
		});
		this.logger.on('send', msg => app.log(msg));
	}

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

	public runCommand(command: string): string | void {
		if (this.current.isServer) {
			this.servers.get(this.servers.selected).socket.emit('command', command);
		} else {
			return execCommandString(command, { executor: this.player.data() }, true);
		}
	}

	private _initLog(message: string): void {
		$('#loading_cover p').text(message);
		this.logger.log('init: ' + message);
	}

	private async _init(): Promise<void> {
		this._initLog('Initializing...');
		if (this._isInitialized) {
			this.logger.warn('Tried to initialize context that is already initialized.');
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
			this.logger.log('Loaded mods: ' + (mods.join('\n') || '(none)'));
		} catch (err) {
			throw new Error('Failed to load mods: ' + err, { cause: err.stack });
		}

		this._initLog('Initializing renderer...');
		try {
			await renderer.init(canvas[0], msg => {
				this._initLog(`Initalizing renderer: ${msg}`);
			});
		} catch (err) {
			throw new Error('Failed to initalize renderer: ' + err, { cause: err.stack });
		}

		this._initLog('Authenticating...');
		if (!navigator.onLine) {
			this.logger.warn('Could not authenitcate (offline)');
		}
		if (!cookies.has('token')) {
			this.logger.warn('Could not authenitcate (no token)');
		}
		if (cookies.has('token') && navigator.onLine) {
			try {
				const result: Account = await getAccount('token', cookies.get('token'));
				Object.assign(this.player, result);
				this._isMultiplayerEnabled = true;
			} catch (e) {
				throw new Error('Could not authenitcate', { cause: e.stack });
			}
		}
		this.saves.activePlayer = this.player.id;

		this._initLog('Initializing UI...');
		ui.init(this);

		this._initLog('Registering event listeners...');
		ui.registerListeners(this);

		ui.update(this);
		this._initLog('Done!');
		$('#loading_cover').fadeOut(1000);
		this.logger.log('Client loaded successful');
		renderer.engine.runRenderLoop(this.update.bind(this));
		setInterval(() => {
			if (this.current instanceof ClientLevel && !this.isPaused) {
				this.current.tick();
			}
		}, 1000 / config.tick_rate);
		this._isInitialized = true;
	}

	public async init(): Promise<void> {
		let cliOptions: CliOptions;
		try {
			cliOptions = await this.app.getCliOptions();
			await this._init();
			return;
		} catch (e) {
			this.logger.error('Client initialization failed: ' + (e.cause ?? e.stack));
			await alert('Client initialization failed: ' + fixPaths(e.cause ?? e.stack));
			if (!cliOptions?.['bs-debug']) {
				close();
			}
			throw e;
		}
	}

	async reload() {
		ui.update(this);
	}

	private _update() {
		if (!(this.current instanceof ClientLevel) || this.isPaused) {
			return;
		}
		const camera = renderer.getCamera(),
			currentSystem = this.current.getNodeSystem(this.current.activePlayer);
		camera.angularSensibilityX = camera.angularSensibilityY = 2000 / +settings.get('sensitivity');
		for (const waypoint of currentSystem.waypoints) {
			const pos = waypoint.screenPos;
			waypoint.marker
				.css({
					position: 'fixed',
					left: Math.min(Math.max(pos.x, 0), innerWidth - +settings.get('font_size')) + 'px',
					top: Math.min(Math.max(pos.y, 0), innerHeight - +settings.get('font_size')) + 'px',
					fill: waypoint.color.toHexString(),
				})
				.filter('p')
				.text(
					Vector2.Distance(new Vector2(pos.x, pos.y), new Vector2(innerWidth / 2, innerHeight / 2)) < 60 || waypoint.active
						? `${waypoint.name} - ${minimize(Vector3.Distance(this.player.data().position, waypoint.position))} km`
						: ''
				);
			waypoint.marker[pos.z > 1 && pos.z < 1.15 ? 'hide' : 'show']();
		}
		$('#hud p.level').text(Math.floor(xpToLevel(this.player.data().xp)));
		$('#hud svg.xp rect').attr('width', (xpToLevel(this.player.data().xp) % 1) * 100 + '%');
		$('#debug .left').html(`
			<span>${version} ${this._mods.size ? `[${[...this._mods.values()].join(', ')}]` : `(vanilla)`}</span><br>
			<span>${renderer.engine.getFps().toFixed()} FPS | ${this.current.tps.toFixed()} TPS</span><br>
			<span>${this.current.id} (${this.current.date.toLocaleString()})</span><br><br>
			<span>
				P: (${camera.target
					.asArray()
					.map(e => e.toFixed(1))
					.join(', ')}) 
				V: (${camera.velocity
					.asArray()
					.map(e => e.toFixed(1))
					.join(', ')}) 
				R: (${camera.alpha.toFixed(2)}, ${camera.beta.toFixed(2)})
			</span><br>
		`);
		const { usedJSHeapSize: used = 0, jsHeapSizeLimit: limit = 0, totalJSHeapSize: total = 0 } = globalThis.performance?.memory || {},
			glInfo = renderer.engine.getGlInfo();
		$('#debug .right').html(`
			<span>Babylon v${Engine.Version} | jQuery v${$.fn.jquery}</span><br>
			<span>${glInfo.version}</span><br>
			<span>${glInfo.renderer}</span><br>
			<span>${`${(used / 1000000).toFixed()}MB/${(limit / 1000000).toFixed()}MB (${(total / 1000000).toFixed()}MB Allocated)`}</span><br>
			<span>${navigator.hardwareConcurrency || 'Unknown'} CPU Threads</span><br><br>
		`);

		renderer.render();
	}

	public update() {
		try {
			this._update();
		} catch (e) {
			this.logger.error('Client update failed: ' + (e.cause ?? e.stack));
			alert('Client update failed: ' + fixPaths(e.cause ?? e.stack));
			throw e;
		}
	}

	public pause() {}

	public unpause() {}

	public startPlaying(level: ClientLevel): boolean {
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
			this.logger.debug('Triggered player.levelup (unimplemented)');
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

	public stopPlaying(level: ClientLevel): boolean {
		for (const event of ['projectile.fire', 'level.tick', 'player.levelup', 'player.death', 'entity.follow_path.start', 'entity.death', 'player.items.change']) {
			level.off(event);
		}
		this._isPaused = true;
		return true;
	}

	public setInitText(text: string): void {
		$('#loading_cover p').text(text);
		this.logger.log('init: ' + text);
	}

	public sendChatMessage(...msg: string[]): void {
		for (const m of msg) {
			this.logger.log(`(chat) ${m}`);
			$(`<li bg=none></li>`)
				.text(m)
				.appendTo('#chat')
				.fadeOut(1000 * +settings.get('chat_timeout'));
			$(`<li bg=none></li>`).text(m).appendTo('#chat-history');
		}
	}
}
