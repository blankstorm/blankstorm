import type { BuildOptions } from 'esbuild';
import { build, context } from 'esbuild';
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { inject } from 'postject';
import { defines, getVersionInfo } from './common';

const { display: displayVersion } = getVersionInfo();

const {
	values: { watch, mode, output },
} = parseArgs({
	options: {
		watch: { type: 'boolean', short: 'w', default: false },
		mode: { type: 'string', short: 'm', default: 'dev' },
		output: { type: 'string', short: 'o', default: 'dist/build' },
	},
});

const outfile = 'dist/build/server.js',
	seaPath = 'dist/blankstorm-server-' + displayVersion + extname(process.execPath);

async function buildSEA() {
	const configPath = join(output, 'sea.json'),
		blobPath = join(output, 'server.blob');

	try {
		writeFileSync(
			configPath,
			JSON.stringify({
				main: outfile,
				output: blobPath,
				disableExperimentalSEAWarning: true,
			})
		);
		execSync('node --experimental-sea-config ' + configPath, { stdio: 'inherit' });
		if (!existsSync(dirname(seaPath))) {
			mkdirSync(dirname(seaPath));
		}
		copyFileSync(process.execPath, seaPath);
		await inject(seaPath, 'NODE_SEA_BLOB', readFileSync(blobPath), {
			machoSegmentName: 'NODE_SEA',
			sentinelFuse: 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
		});
	} catch (e) {
		console.error(e);
	}
}

const esbuildConfig = {
	entryPoints: ['src/server/cli.ts'],
	bundle: true,
	outfile,
	platform: 'node',
	keepNames: true,
	define: defines(mode),
	plugins: [
		{
			name: 'server-sea',
			setup({ onEnd }) {
				onEnd(buildSEA);
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
