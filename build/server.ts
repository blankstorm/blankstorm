import { BuildOptions, context, build } from 'esbuild';
import { parseArgs } from 'node:util';
import { getOptions } from './options';
import { getVersionInfo } from './utils';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, extname } from 'node:path';
import { inject } from 'postject';
import $package from '../package.json' assert { type: 'json' };

const { display: displayVersion } = getVersionInfo();

const {
	values: { watch, mode },
} = parseArgs({
	options: {
		watch: { type: 'boolean', short: 'w', default: false },
		mode: { type: 'string', short: 'm', default: 'dev' },
	},
});

const outfile = 'dist/build/server.js',
	seaConfig = 'dist/build/sea.json',
	seaPath = 'dist/blankstorm-server-' + displayVersion + extname(process.execPath),
	seaBlob = 'dist/build/server.blob';

const esbuildConfig = {
	entryPoints: ['src/server/cli.ts'],
	bundle: true,
	outfile,
	platform: 'node',
	keepNames: true,
	define: { $build: JSON.stringify(getOptions(mode)), $package: JSON.stringify($package) },
	plugins: [
		{
			name: 'server-sea',
			setup({ onEnd }) {
				onEnd(async () => {
					try {
						writeFileSync(
							seaConfig,
							JSON.stringify({
								main: outfile,
								output: seaBlob,
								disableExperimentalSEAWarning: true,
							})
						);
						execSync('node --experimental-sea-config ' + seaConfig, { stdio: 'inherit' });
						if (!existsSync(dirname(seaPath))) {
							mkdirSync(dirname(seaPath));
						}
						copyFileSync(process.execPath, seaPath);
						await inject(seaPath, 'NODE_SEA_BLOB', readFileSync(seaBlob), {
							machoSegmentName: 'NODE_SEA',
							sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
						});
					} catch (e) {
						console.error(e);
					}
				});
			},
		},
	],
} satisfies BuildOptions;

if (watch) {
	console.log('Watching for changes...');
	const ctx = await context(esbuildConfig);
	await ctx.watch();
} else {
	await build(esbuildConfig);
}
