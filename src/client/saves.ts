import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import $ from 'jquery';
import * as fs from 'node:fs';
import { isJSON } from 'utilium';
import { FolderMap } from 'utilium/fs.js';
import { Player } from '../core/entities/player';
import type { LevelJSON } from '../core/level';
import { Level } from '../core/level';
import { config, displayVersion } from '../core/metadata';
import { randomInSphere } from '../core/utils';
import { path } from './config';
import { level, load } from './level';
import * as locales from './locales';
import { alert, confirm } from './ui/dialog';
import { instantiateTemplate } from './ui/utils';
import { account } from './user';
import { logger } from './utils';
import { download } from 'utilium/dom.js';

export async function createDefault(name: string): Promise<Level> {
	const level = new Level();
	level.name = name;
	await level.ready();
	const system = level.generateSystem('Kurassh', Vector2.Zero());

	const player = new Player(account.id, system);
	player.fleet.addFromStrings('mosquito', 'cillus');
	player.fleet.at(0).position.z += 7.5;
	player.name = account.username;
	player.fleet.position = new Vector3(0, 0, -1000).add(randomInSphere(50, true));
	player.position = player.fleet.position.clone();
	player.rotation = Vector3.Zero();

	level.rootSystem = system;
	logger.log('Created default level: ' + name);
	return level;
}

export function createSaveListItem(save: LevelJSON): JQuery<HTMLLIElement> {
	const instance = instantiateTemplate('#save').find('li');

	const loadAndPlay = async () => {
		$('#loading_cover').show();
		try {
			logger.info('Loading level from save ' + save.id);

			const replace = await replaceGuest(save);
			logger.debug('Replacing guest: ' + (replace ? 'Yes' : 'No'));
			if (!replace) {
				$('#loading_cover,#hud,canvas.game').hide();
				$('#saves').show();
			}
			load(Level.FromJSON(save));
			$('#loading_cover').hide();
		} catch (e) {
			logger.error(e instanceof Error ? e : e + '');
			const loadAnyway = await confirm('Failed to load save: ' + e + '\nLoad the save anyway?');
			if (config.debug && loadAnyway) {
				$('#loading_cover').hide();
				throw e;
			}
			if (!loadAnyway) {
				await alert('Failed to load save: ' + e);
			}
			$('#loading_cover,#hud,canvas.game').hide();
			$('#saves').show();
		}
	};

	instance
		.on('click', () => {
			$('.selected').removeClass('selected');
			instance.addClass('selected');
		})
		.on('dblclick', loadAndPlay);

	instance.find('.delete').on('click', async e => {
		if (e.shiftKey || (await confirm('Are you sure?'))) {
			remove(save.id);
			instance.remove();
		}
	});

	instance.find('.download').on('click', () => download(JSON.stringify(save), (save.name || 'save') + '.json'));
	instance.find('.play').on('click', loadAndPlay);
	instance.find('.edit').on('click', () => {
		$('#save-edit').find('.id').val(save.id);
		$('#save-edit').find('.name').val(save.name);
		$<HTMLDialogElement>('#save-edit')[0].showModal();
	});
	instance.find('.name').text(save.name);
	instance.find('.version').text(displayVersion(save.version));
	instance.find('.date').text(new Date(save.date).toLocaleString());

	instance.prependTo('#saves ul');
	return instance;
}

/**
 * Runtime stuff for a save
 */
export interface SaveData {
	gui: JQuery<HTMLLIElement>;
}

const runtimeData = new Map<string, SaveData>();

let saves: FolderMap;

export function init() {
	const folderPath = path + '/saves';
	if (!fs.existsSync(folderPath)) {
		fs.mkdirSync(folderPath);
	}
	saves = new FolderMap(folderPath, { suffix: '.json' });
	for (const [id, content] of saves) {
		if (!isJSON(content)) {
			logger.debug('Skipping invalid save: ' + id);
			continue;
		}

		if (runtimeData.has(id)) {
			logger.debug('Skipping already initialized save: ' + id);
			continue;
		}

		logger.debug('Initializing save: ' + id);
		const save = JSON.parse(content);
		runtimeData.set(save.id, { gui: createSaveListItem(save) });
	}
	logger.info('Loaded ' + saves.size + ' saves');
}

export function get(id: string): LevelJSON {
	const data = saves.get(id);
	if (!isJSON(data)) {
		throw new Error('Cannot get invalid save: ' + id);
	}
	return JSON.parse(data);
}

export function add(save: LevelJSON): void {
	if (saves.has(save.id)) {
		throw new ReferenceError('Can not add save because it already exists: ' + save.id);
	}
	logger.debug('Added save: ' + save.id);
	runtimeData.set(save.id, { gui: createSaveListItem(save) });
	saves.set(save.id, JSON.stringify(save));
}

export function update(save: LevelJSON): void {
	const date = new Date();
	save.date = date.toJSON();
	const gui = runtimeData.get(save.id)?.gui;
	gui?.find('.name').text(save.name);
	gui?.find('.version').text(displayVersion(save.version));
	gui?.find('.date').text(date.toLocaleString());
	saves.set(save.id, JSON.stringify(save));
}

export function has(id: string): boolean {
	return saves.has(id);
}

export function remove(save: string | LevelJSON): boolean {
	const id = typeof save == 'string' ? save : save.id;
	logger.debug('Deleting save: ' + id);
	runtimeData.get(id)?.gui.remove();
	runtimeData.delete(id);
	return saves.delete(id);
}

export { remove as delete };

/**
 * Writes a level to the save file
 */
export function flush(): void {
	if (!level) {
		throw new ReferenceError('No level loaded');
	}
	$('#pause .save').text(locales.text('saving'));
	logger.debug('Writing save: ' + level.id);
	update(level.toJSON());
	$('#pause .save').text(locales.textFor('#pause button.save'));
}

export async function replaceGuest(save: LevelJSON): Promise<boolean> {
	if (account.id == '_guest_') {
		return true;
	}

	const guest = save.entities.find(entity => entity.entityType == 'Player' && entity.id == '_guest_');

	if (!guest) {
		return false;
	}

	if (!(await confirm(locales.text('replace_guest_notice')))) {
		return false;
	}

	for (const entity of save.entities) {
		for (const property of ['id', 'owner', 'parent'] as const) {
			if (entity[property] == '_guest_') {
				entity[property] = account.id;
			}
		}

		if (entity.name == '[guest]') {
			entity.name = account.username;
		}
	}

	return true;
}
