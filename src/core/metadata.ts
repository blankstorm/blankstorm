import * as version from 'utilium/version.js';

export const game_url = 'https://blankstorm.net';

export const config = {
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

export const knownVersions = [
	'infdev_1',
	'infdev_2',
	'infdev_3',
	'infdev_4',
	'infdev_5',
	'infdev_6',
	'infdev_7',
	'infdev_8',
	'infdev_9',
	'infdev_10',
	'infdev_11',
	'infdev_12',
	'alpha_1.0.0',
	'alpha_1.1.0',
	'alpha_1.2.0',
	'alpha_1.2.1',
	'alpha_1.3.0',
	'alpha_1.3.1',
	'alpha_1.4.0',
	'alpha_1.4.1',
	'alpha_1.4.2',
	'alpha_1.4.3',
	'alpha_1.4.4',
	'alpha_2.0.0',
	'alpha_2.0.1',
	'alpha_2.0.2',
	'alpha_2.0.3',
] as const;

export const currentVersion = 'alpha_2.0.3';

export type VersionID = (typeof knownVersions)[number];

type Normalize<V extends VersionID> = V extends version.Full ? V : `1.0.0_${V}`;
type Display<V extends VersionID> = version.Parse<Normalize<V>, true>['display'];

export function displayVersion(): Display<typeof currentVersion>;
export function displayVersion<const V extends VersionID>(v: V): Display<V>;
export function displayVersion<const V extends VersionID>(v?: V): Display<V> {
	v ||= currentVersion as V;
	const normalized = (version.regex.test(v) ? v : `1.0.0_${v}`) as Normalize<V>;
	return version.parse(normalized, true).display;
}
