import * as esbuild from 'esbuild';
import { exec as pkg } from 'pkg';
import { parseArgs } from 'node:util';
import { replace } from 'esbuild-plugin-replace';
import { getOptions, getReplacements } from './options';
import counterPlugin from './counter';
import { getVersionFromPackage, renameOutput } from './utils';

const version = getVersionFromPackage();

const options = {
	verbose: false,
	output: 'src/server/index.ts',
	watch: false,
	mode: 'dev',
	...parseArgs({
		options: {
			verbose: { type: 'boolean', short: 'v', default: false },
			watch: { type: 'boolean', short: 'w', default: false },
			output: { type: 'string', short: 'o', default: 'dist/web' },
			mode: { type: 'string', short: 'm', default: 'dev' },
		},
	}).values,
};

const outfile = 'dist/tmp/server.js';

const esbuildConfig = {
	entryPoints: [],
	bundle: true,
	outfile,
	platform: 'node',
	keepNames: true,
	plugins: [
		replace({ include: /\.ts$/, values: getReplacements(getOptions(options.mode)) }),
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
