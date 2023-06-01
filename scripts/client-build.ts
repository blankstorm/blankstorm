import * as esbuild from 'esbuild';
import type { BuildOptions } from 'esbuild';
import * as fs from 'fs';
import { join, resolve } from 'path';
import pkg from '../package.json' assert { type: 'json' };
import { version as rawVersion } from '../src/core/meta';
import * as electronBuilder from 'electron-builder';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';

const options = {
		verbose: false,
		output: 'dist/tmp/client',
		watch: false,
		'for-app': false,
		...parseArgs({
			options: {
				verbose: { type: 'boolean', short: 'v', default: false },
				watch: { type: 'boolean', short: 'w', default: false },
				output: { type: 'string', short: 'o', default: 'dist/web' },
				'for-app': { type: 'boolean', default: false },
			},
		}).values,
	},
	input = 'src/client';

const version = rawVersion.replaceAll('_', '-');

function fromPath(path: string) {
	if (!fs.statSync(path).isDirectory()) {
		return [path];
	}
	const files = [];
	for (const file of fs.readdirSync(path)) {
		const fpath = join(path, file);
		if (fs.statSync(fpath).isDirectory()) {
			files.push(...fromPath(fpath));
		} else {
			files.push(fpath);
		}
	}

	return files;
}

const _files0 = options.output + '/**/*';
const electronBuilderConfig = {
	publish: 'never',
	projectDir: resolve(fileURLToPath(import.meta.url), '..', '..'),
	config: {
		extends: null,
		extraMetadata: {
			main: join(options.output, 'app.cjs'),
		},
		files: [_files0, 'package.json'],
		appId: 'dev.drvortex.blankstorm',
		productName: 'Blankstorm Client',
		copyright: 'Copyright © 2022 ${author}',
		icon: './icon.png',
		nsis: {
			oneClick: false,
			allowToChangeInstallationDirectory: true,
			removeDefaultUninstallWelcomePage: true,
			deleteAppDataOnUninstall: true,
		},
		win: {
			executableName: 'blankstorm-client',
		},
		linux: {
			category: 'Game',
		},
		mac: {
			category: 'public.app-category.games',
		},
	},
};

const entryPoints = ['index.ts', 'index.html', 'images', 'locales', 'models', 'music', 'sfx', 'shaders', 'styles'];
if (options['for-app']) {
	entryPoints.push('app.cjs', 'preload.cjs');
}
const esbuildConfig = {
	entryPoints: entryPoints.flatMap(p => fromPath(join(input, p))),
	assetNames: '[dir]/[name]',
	outdir: options.output,
	bundle: true,
	minify: true,
	keepNames: true,
	sourcemap: true,
	format: 'esm',
	loader: Object.fromEntries(['.html', '.png', '.svg', '.fx', '.jpg', '.glb', '.mp3', '.gltf', '.json', '.cjs'].map(e => [e, 'copy'])),
	plugins: [
		{
			name: 'blankstorm',
			setup(build) {
				let count = 0;
				build.onStart(() => {
					console.log(options.watch ? `---- Building #${++count} --` : 'Building...');
				});
				build.onEnd(async () => {
					try {
						if (options['for-app']) {
							await electronBuilder.build(electronBuilderConfig as electronBuilder.CliOptions);

							const renames = [
								[`Blankstorm Client Setup ${pkg.version}.exe`, `blankstorm-client-${version}.exe`],
								[`Blankstorm Client Setup ${pkg.version}.exe.blockmap`, `blankstorm-client-${version}.exe.blockmap`],
								[`Blankstorm Client-${pkg.version}.AppImage`, `blankstorm-client-${version}.AppImage`],
								[`blankstorm-client_${pkg.version}_amd64.snap`, `blankstorm-client-${version}.snap`],
							];

							const deletes = ['builder-debug.yml', 'builder-effective-config.yaml', 'latest.yml', '.icon-ico'];

							for (const [oldName, newName] of renames) {
								const oldPath = join('dist', oldName),
									newPath = join('dist', newName);
								if (fs.existsSync(newPath)) {
									fs.rmSync(newPath, { recursive: true, force: true });
								}
								if (fs.existsSync(oldPath)) {
									fs.renameSync(oldPath, newPath);
								}
							}

							for (const file of deletes) {
								fs.rmSync(join('dist', file), { recursive: true, force: true });
							}
						}
						console.log(options.watch ? `---- Built #${count} -----` : 'Built!');
					} catch (err) {
						console.error(`Build failed: ` + err.stack);
						console.log(options.watch ? `- Build #${count} Failed -` : 'Build failed!');
					}
				});
			},
		},
	],
} as BuildOptions;

if (options.watch) {
	console.log('Watching...');
	const ctx = await esbuild.context(esbuildConfig);
	await ctx.watch();
} else {
	await esbuild.build(esbuildConfig);
}
