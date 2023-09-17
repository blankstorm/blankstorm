import * as esbuild from 'esbuild';
import { exec as pkg } from 'pkg';
import { parseArgs } from 'node:util';
import { getOptions } from './options';
import counterPlugin from './counter';
import { getVersionFromPackage, renameOutput } from './utils';

const version = getVersionFromPackage();

const options = {
	verbose: false,
	watch: false,
	mode: 'dev',
	...parseArgs({
		options: {
			verbose: { type: 'boolean', short: 'v', default: false },
			watch: { type: 'boolean', short: 'w', default: false },
			mode: { type: 'string', short: 'm', default: 'dev' },
		},
	}).values,
};

const outfile = 'build/server.js';

const esbuildConfig = {
	entryPoints: ['src/server/cli.ts'],
	bundle: true,
	outfile,
	platform: 'node',
	keepNames: true,
	define: { $build: JSON.stringify(getOptions(options.mode)) },
	plugins: [
		{
			name: 'app-builder-server',
			setup(build) {
				build.onEnd(async () => {
					await pkg([outfile, '--output', 'dist/server', '--target', 'latest-win,latest-linux,latest-macos']);
					renameOutput({
						'server-win.exe': `blankstorm-server-${version}.exe`,
						'server-macos': `blankstorm-server-${version}-macos`,
						'server-linux': `blankstorm-server-${version}-linux`,
					});
				});
			},
		},
		counterPlugin(options.watch),
	],
} as esbuild.BuildOptions;

if (options.watch) {
	console.log('Watching...');
	const ctx = await esbuild.context(esbuildConfig);
	await ctx.watch();
} else {
	await esbuild.build(esbuildConfig);
}
