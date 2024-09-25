export { version as fullVersion } from '../../package.json';

export const game_url = 'https://blankstorm.net';

export const config = {
	load_remote_manifest: false,
	debug: $debug,
	overwrite_invalid: true,
	default_port: 1123,
	region_size: 1e5,
	tick_rate: 30,
	level_max_size: 1000,
	system_generation: {
		difficulty: 1,
		max_size: 5e3,
		connections: {
			probability: 0.5,
			distance_min: 0.25,
			distance_max: 10,
		},
		stars: {
			min: 1,
			max: 1,
			radius_min: 300,
			radius_max: 500,
			color_min: [0.3, 0.3, 0.3],
			color_max: [0.4, 0.4, 0.4],
		},
		planets: {
			min: 1,
			max: 9,
			radius_min: 25,
			radius_max: 50,
			distance_max: 5e3,
		},
	},
};

const _versionGroups = ['prototype', 'alpha'] as const;
const _versions = {
	infdev_1: { text: 'Infdev 1', group: 'prototype' },
	infdev_2: { text: 'Infdev 2', group: 'prototype' },
	infdev_3: { text: 'Infdev 3', group: 'prototype' },
	infdev_4: { text: 'Infdev 4', group: 'prototype' },
	infdev_5: { text: 'Infdev 5', group: 'prototype' },
	infdev_6: { text: 'Infdev 6', group: 'prototype' },
	infdev_7: { text: 'Infdev 7', group: 'prototype' },
	infdev_8: { text: 'Infdev 8', group: 'prototype' },
	infdev_9: { text: 'Infdev 9', group: 'prototype' },
	infdev_10: { text: 'Infdev 10', group: 'prototype' },
	infdev_11: { text: 'Infdev 11', group: 'prototype' },
	infdev_12: { text: 'Infdev 12', group: 'prototype' },
	'alpha_1.0.0': { text: 'Alpha 1.0.0', group: 'alpha' },
	'alpha_1.1.0': { text: 'Alpha 1.1.0', group: 'alpha' },
	'alpha_1.2.0': { text: 'Alpha 1.2.0', group: 'alpha' },
	'alpha_1.2.1': { text: 'Alpha 1.2.1', group: 'alpha' },
	'alpha_1.3.0': { text: 'Alpha 1.3.0', group: 'alpha' },
	'alpha_1.3.1': { text: 'Alpha 1.3.1', group: 'alpha' },
	'alpha_1.4.0': { text: 'Alpha 1.4.0', group: 'alpha' },
	'alpha_1.4.1': { text: 'Alpha 1.4.1', group: 'alpha' },
	'alpha_1.4.2': { text: 'Alpha 1.4.2', group: 'alpha' },
	'alpha_1.4.3': { text: 'Alpha 1.4.3', group: 'alpha' },
	'alpha_1.4.4': { text: 'Alpha 1.4.4', group: 'alpha' },
	'alpha_2.0.0': { text: 'Alpha 2.0.0', group: 'alpha' },
};

export type VersionID = keyof typeof _versions;

export interface Version {
	text: string;
	group: (typeof _versionGroups)[number];
}

export const version: VersionID = 'alpha_2.0.0';

export const versions = new Map(Object.entries(_versions)) as Map<VersionID, Version>;
