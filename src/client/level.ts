import type { IVector3Like } from '@babylonjs/core/Maths/math.like';
import { Level, logger, type EntityJSON } from '../core';
import * as renderer from '../renderer';
import { playsound } from './audio';
import * as settings from './settings';
import { isServer, pause } from './config';

export let level: Level = new Level();

export function setLevel(value: Level) {
	logger.log('Using new level: ' + value.id);
	level = value;
}

export function registerListeners() {
	level.on('update', () => {
		void renderer.update(level.toJSON());
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

export function unload(): void {
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
