import * as version from 'utilium/version.js';

export const game_url = 'https://blankstorm.net';

// $debug is inlined at build time, this is for development
Object.assign(globalThis, { $debug: false });

export const config = {
	debug: $debug,
	overwrite_invalid: true,
	default_port: 1123,
	region_size: 1e5,
	tick_rate: 60,
	level_max_size: 1000,
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
