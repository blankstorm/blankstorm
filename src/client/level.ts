import $ from 'jquery';
import type { IVector3Like } from '@babylonjs/core/Maths/math.like';
import type { BS_Level } from '../core/level';
import type { BS_EntityJSON } from '../core/entities/.tmp.entity';
import { currentVersion } from '../core/metadata';
import { logger } from '../core/utils';
import * as renderer from '../renderer';
import { playsound } from './audio';
import * as settings from './settings';
import { isServer, pause, unpause } from './config';
import { text } from './locales';
import { alert } from './ui/dialog';

export let level: BS_Level | undefined;

export function setLevel(value: BS_Level) {
	logger.info('Using new level: ' + value.id);
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
		if (entity.type == 'player') {
			renderer.resetCamera();
		}
	});
	level.on('entity_path_start', (entityID: string, path: IVector3Like[]) => {
		console.debug('Moving along path:', path);
		renderer.startFollowingPath(entityID, path, settings.get('show_path_gizmos'));
	});
	level.on('entity_death', (entity: BS_EntityJSON) => {
		if (entity.type == 'Ship') {
			playsound('destroy_ship', +settings.get('sfx'));
		}
	});
}

export function load(newLevel: BS_Level): boolean {
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
