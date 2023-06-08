export const GAME_URL = 'https://blankstorm.drvortex.dev';
export const SHORT_URL = 'https://bs.drvortex.dev';

export const config = {
	load_remote_manifest: false,
	debug_mode: true,
	overwrite_invalid_json: true,
	default_port: 1123,
	region_size: 1e5,
	tick_rate: 10,
	system_generation: {
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

const _versionGroups = ['infdev', 'alpha'] as const,
	_versions = {
		infdev_1: { text: 'Infdev 1', group: 'infdev' },
		infdev_2: { text: 'Infdev 2', group: 'infdev' },
		infdev_3: { text: 'Infdev 3', group: 'infdev' },
		infdev_4: { text: 'Infdev 4', group: 'infdev' },
		infdev_5: { text: 'Infdev 5', group: 'infdev' },
		infdev_6: { text: 'Infdev 6', group: 'infdev' },
		infdev_7: { text: 'Infdev 7', group: 'infdev' },
		infdev_8: { text: 'Infdev 8', group: 'infdev' },
		infdev_9: { text: 'Infdev 9', group: 'infdev' },
		infdev_10: { text: 'Infdev 10', group: 'infdev' },
		infdev_11: { text: 'Infdev 11', group: 'infdev' },
		infdev_12: { text: 'Infdev 12', group: 'infdev' },
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
	};

export type VersionID = keyof typeof _versions;

export interface Version {
	text: string;
	group: typeof _versionGroups[number];
}

export const version: VersionID = 'alpha_1.4.3';
export const versions = new Map(Object.entries(_versions)) as Map<VersionID, Version>;

if (config.load_remote_manifest) {
	fetch(GAME_URL + '/versions.json')
		.then(response => response.json())
		.then(data => {
			for (const [key, value] of data) {
				versions.set(key, value);
			}
		})
		.catch(err => console.warn('Failed to retrieve version manifest: ' + err));
}
