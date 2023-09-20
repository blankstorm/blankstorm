import type { Log } from '../core/Log';
import type { SerializedSystem } from '../core/System';
import type { GenericProjectile } from '../core/generic/hardpoints';
import type { ItemCollection, ItemID } from '../core/generic/items';
import type { SerializedNode } from '../core/nodes/Node';
import type { ClientLevel } from './ClientLevel';
import { SaveMap } from './Save';
import { ServerMap } from './Server';
import type { ClientContext, PlayerContext } from './contexts';
import { version } from '../core/metadata';
import { settings } from './settings';
import { minimize } from './utils';
import type * as renderer from '../renderer/index';
import * as ui from './ui/ui';
import { playsound } from './audio';
const fs = app.require('fs');

export class Client implements ClientContext {
	log: Log;
	public readonly saves: SaveMap;
	public readonly servers: ServerMap;
	current: ClientLevel;
	player: PlayerContext;
	renderer: typeof renderer;

	protected _isPaused: boolean;
	public get isPaused(): boolean {
		return this._isPaused;
	}

	constructor(public readonly path: string, public readonly ui) {
		this.saves = new SaveMap(path + '/saves', this);
		this.servers = new ServerMap(path + '/servers.json', this);
	}

	async init() {}

	async reload() {}

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
		this.renderer.clear();
		this.renderer.update(this.player.system.toJSON());
		level.on('projectile.fire', async (hardpointID: string, targetID: string, projectile: GenericProjectile) => {
			this.renderer.fireProjectile(hardpointID, targetID, projectile);
		});
		level.on('system.tick', async (system: SerializedSystem) => {
			if (this.player.system.id == system.id) {
				this.renderer.update(system);
			}
		});
		level.on('player.levelup', async () => {
			this.log.debug('Triggered player.levelup (unimplemented)');
		});
		level.on('player.death', async () => {
			this.renderer.getCamera().reset();
		});
		level.on('entity.follow_path.start', async (entityID: string, path: number[][]) => {
			this.renderer.startFollowingPath(entityID, path);
		});
		level.on('entity.death', async (node: SerializedNode) => {
			if (node.nodeType == 'ship') {
				playsound('destroy_ship', +settings.get('sfx'));
			}
		});
		level.on('player.items.change', async (player, items: ItemCollection) => {
			for (const [id, amount] of Object.entries(items) as [ItemID, number][]) {
				$(ui.item_ui[id]).find('.count').text(minimize(amount));
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
