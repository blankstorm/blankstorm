import * as esbuild from 'esbuild';
import * as fs from 'node:fs';
import path from 'node:path';
import pkg from '../package.json' assert { type: 'json' };
import * as electronBuilder from 'electron-builder';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { getOptions, getReplacements } from './options';
import counterPlugin from './counter';
import { deleteOutput, getVersionFromPackage, renameOutput } from './utils';
import { replace } from 'esbuild-plugin-replace';
import glslPlugin from 'esbuild-plugin-glslx';
import archiver from 'archiver';
import { execSync } from 'node:child_process';
const dirname = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const version = getVersionFromPackage();

const options = {
		verbose: false,
		output: path.join(dirname, 'build/client'),
		watch: false,
		'no-app': false,
		mode: 'dev',
		debug: false,
		...parseArgs({
			options: {
				verbose: { type: 'boolean', short: 'v', default: false },
				watch: { type: 'boolean', short: 'w', default: false },
				output: { type: 'string', short: 'o', default: path.join(dirname, 'build/client') },
				'no-app': { type: 'boolean', default: false },
				mode: { type: 'string', short: 'm', default: 'dev' },
				debug: { type: 'boolean', default: false },
			},
		}).values,
	},
	input = path.join(dirname, 'src/client'),
	asset_path = path.join(dirname, 'build/assets');

function fromPath(sourcePath: string) {
	if (!fs.statSync(sourcePath).isDirectory()) {
		return [sourcePath];
	}
	const files = [];
	for (const file of fs.readdirSync(sourcePath)) {
		const fpath = path.join(sourcePath, file);
		if (fs.statSync(fpath).isDirectory()) {
			files.push(...fromPath(fpath));
		} else {
			files.push(fpath);
		}
	}

	return files;
}

const copyright = `Copyright © ${new Date().getFullYear()} ${pkg.author}. All Rights Reserved.`;
const _files0 = options.output + '/**/*';
const electronBuilderConfig: electronBuilder.CliOptions = {
	publish: 'never',
	projectDir: dirname,
	config: {
		extends: null,
		extraMetadata: {
			main: 'build/client/app.cjs',
			version: pkg.version,
		},
		files: ['build/client/**/*', 'package.json'],
		appId: 'dev.drvortex.blankstorm',
		productName: 'Blankstorm Client',
		copyright,
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

const entryPoints = ['index.ts', 'index.html', 'locales', 'styles', 'app.cjs', 'preload.cjs'];
const buildOptions = getOptions(options.mode);

const esbuildConfig: esbuild.BuildOptions = {
	entryPoints: entryPoints.flatMap(p => fromPath(path.join(input, p))),
	assetNames: '[dir]/[name]',
	outdir: options.output,
	bundle: true,
	minify: !options.debug,
	keepNames: true,
	sourcemap: true,
	format: 'esm',
	loader: {
		'.html': 'copy',
		'.json': 'copy',
		'.cjs': 'copy',
	},
	define: { $build: JSON.stringify(buildOptions) },
	plugins: [
		glslPlugin(),
		replace({ include: /\.(css|html|ts)$/, values: { ...getReplacements(buildOptions), _copyright: copyright } }),
		{
			name: 'app-builder-client',
			setup(build: esbuild.PluginBuild) {
				build.onStart(() => {
					//build assets
					for (const f of fs.readdirSync(path.join(dirname, 'assets'))) {
						if (f == 'models') {
							execSync('bash ' + path.join(dirname, 'assets/models/export.sh'));
							continue;
						}

						fs.cpSync(path.join(dirname, 'assets', f), path.join(asset_path, f), { recursive: true });
					}
					fs.cpSync(asset_path, path.join(options.output, buildOptions.asset_dir), { recursive: true });
				});
				build.onEnd(async () => {
					try {
						if (!options['no-app']) {
							await electronBuilder.build(electronBuilderConfig);
							for (const platform of ['win', 'linux']) {
								renameOutput({ [`${platform}-unpacked`]: `blankstorm-client-${version}-${platform}` });
								const dirPath = `dist/blankstorm-client-${version}-${platform}`;
								if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
									continue;
								}

								console.log('Compressing: ' + platform);
								const archive = archiver('zip', { zlib: { level: 9 } });

								archive.pipe(fs.createWriteStream(`dist/blankstorm-client-${version}-${platform}.zip`));
								await archive.directory(dirPath, false).finalize();
								console.log('Compressed: ' + platform);
							}
							renameOutput({
								[`Blankstorm Client Setup ${pkg.version}.exe`]: `blankstorm-client-${version}.exe`,
								[`Blankstorm Client-${pkg.version}.AppImage`]: `blankstorm-client-${version}.AppImage`,
								[`blankstorm-client_${pkg.version}_amd64.snap`]: `blankstorm-client-${version}.snap`,
								[`Blankstorm Client-${pkg.version}.dmg`]: `blankstorm-client-${version}.dmg`,
								[`Blankstorm Client-${pkg.version}-mac.zip`]: `blankstorm-client-${version}-mac.zip`,
							});
							deleteOutput([
								'builder-debug.yml',
								'builder-effective-config.yaml',
								'latest.yml',
								'latest-mac.yml',
								'.icon-ico',
								'tmp',
								`Blankstorm Client Setup ${pkg.version}.exe.blockmap`,
								`Blankstorm Client-${pkg.version}-mac.zip.blockmap`,
								`Blankstorm Client-${pkg.version}.dmg.blockmap`,
							]);
						}
					} catch (e) {
						console.error(e);
					}
				});
			},
		},
		counterPlugin(options.watch),
	],
};

const symlinkPath = path.join(input, buildOptions.asset_dir);
if (fs.existsSync(symlinkPath)) {
	fs.unlinkSync(symlinkPath);
}
if (!fs.existsSync(asset_path)) {
	fs.mkdirSync(asset_path, { recursive: true });
}
fs.symlinkSync(asset_path, symlinkPath);
// see https://stackoverflow.com/a/34434957/17637456

if (options.watch) {
	console.log('Watching...');
	const ctx = await esbuild.context(esbuildConfig);
	await ctx.watch();
} else {
	await esbuild.build(esbuildConfig);
}
fs.unlinkSync(symlinkPath);
