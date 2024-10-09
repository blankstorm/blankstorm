import $ from 'jquery';
import type { IVector3Like } from '@babylonjs/core/Maths/math.like.js';
import type { Level } from '../core/level.js';
import type { EntityJSON } from '../core/entities/entity.js';
import { currentVersion } from '../core/metadata.js';
import { logger } from '../core/utils.js';
import * as renderer from '../renderer/index.js';
import { playsound } from './audio.js';
import * as settings from './settings.js';
import { isServer, pause, unpause } from './config.js';
import { text } from './locales.js';
import { alert } from './ui/dialog.js';

export let level: Level | undefined;

export function setLevel(value: Level) {
	logger.log('Using new level: ' + value.id);
	level = value;
}

export function registerListeners() {
	if (!level) {
		throw new ReferenceError('No level loaded');
	}
	level.on('update', () => {
		void renderer.update(level!.toJSON());
	});
	level.on('player_levelup', () => {
		logger.warn('Triggered player_levelup (unimplemented)');
	});
	level.on('entity_removed', entity => {
		if (entity.entityType == 'player') {
			renderer.resetCamera();
		}
	});
	level.on('entity_path_start', (entityID: string, path: IVector3Like[]) => {
		console.debug('Moving along path:', path);
		renderer.startFollowingPath(entityID, path, settings.get('show_path_gizmos'));
	});
	level.on('entity_death', (entity: EntityJSON) => {
		if (entity.entityType == 'Ship') {
			playsound('destroy_ship', +settings.get('sfx'));
		}
	});
}

export function load(newLevel: Level): boolean {
	if (!newLevel) {
		logger.warn('No level loaded');
		void alert(text('load_no_level'));
		return false;
	}
	if (newLevel.version != currentVersion) {
		logger.warn('Can not load level due to version mismatch: ' + newLevel.id);
		void alert(text('bad_version'));
		return false;
	}

	$('#saves,#servers').hide();
	$('canvas.game').show().trigger('focus');
	$('#hud').show();
	level = newLevel;
	renderer.clear();
	void renderer.update(newLevel.toJSON());
	unpause();
	return true;
}

export function unload(): void {
	if (!level) {
		throw new ReferenceError('No level loaded');
	}
	renderer.clear();
	level.removeAllListeners();
	pause();
	$('.ingame').hide();
	if (!isServer) {
		$('#main').show();
	}
	logger.debug('Clearing current level');
	$('.waypoint-li,.waypoint-marker').remove();
}
