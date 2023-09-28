import { Log } from '../core/Log';
import type { SerializedSystem } from '../core/System';
import type { GenericProjectile } from '../core/generic/hardpoints';
import type { ItemCollection, ItemID } from '../core/generic/items';
import type { SerializedNode } from '../core/nodes/Node';
import type { ClientLevel } from './ClientLevel';
import { SaveMap } from './Save';
import { ServerMap } from './Server';
import type { PlayerContext } from './contexts';
import { version } from '../core/metadata';
import { settings } from './settings';
import { minimize } from './utils';
import * as renderer from '../renderer/index';
import * as ui from './ui/ui';
import { playsound } from './audio';

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
	public readonly saves: SaveMap;
	public readonly servers: ServerMap;
	public readonly ui: ui.Context;
	protected _current: ClientLevel;
	public get current(): ClientLevel {
		return this._current;
	}
	public set current(value: ClientLevel) {
		this._current = value;
	}
	protected _player: PlayerContext;
	public get player(): PlayerContext {
		return this._player;
	}
	public set player(value: PlayerContext) {
		this._player = value;
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
	constructor(public readonly path: string) {
		this.saves = new SaveMap(path + '/saves', this);
		this.servers = new ServerMap(path + '/servers.json', this);
	}

	async init() {
		if (this._isInitialized) {
			this.log.warn('Tried to initialize context that is already initialized.');
			return;
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
