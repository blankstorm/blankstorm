import * as esbuild from 'esbuild';
import * as fs from 'fs';
import path from 'path';
import pkg from '../package.json' assert { type: 'json' };
import * as electronBuilder from 'electron-builder';
import { fileURLToPath } from 'url';
import { parseArgs } from 'util';
import { getOptions, getReplacements } from './options';
import counterPlugin from './counter';
import { deleteOutput, getVersionFromPackage, renameOutput } from './utils';
import { replace } from 'esbuild-plugin-replace';
import archiver from 'archiver';
const version = getVersionFromPackage();

const options = {
		verbose: false,
		output: 'dist/tmp/client',
		watch: false,
		app: false,
		mode: 'dev',
		...parseArgs({
			options: {
				verbose: { type: 'boolean', short: 'v', default: false },
				watch: { type: 'boolean', short: 'w', default: false },
				output: { type: 'string', short: 'o', default: 'dist/tmp/client' },
				app: { type: 'boolean', default: false },
				mode: { type: 'string', short: 'm', default: 'dev' },
			},
		}).values,
	},
	input = 'src/client',
	asset_path = 'assets';

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
	projectDir: path.resolve(fileURLToPath(import.meta.url), '..', '..'),
	config: {
		extends: null,
		extraMetadata: {
			main: path.join(options.output, 'app.cjs'),
			version: pkg.version,
		},
		files: [_files0, 'package.json'],
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

const entryPoints = ['index.ts', 'index.html', 'locales', 'shaders', 'styles', 'app.cjs', 'preload.cjs'];
const buildOptions = getOptions(options.mode);

const esbuildConfig: esbuild.BuildOptions = {
	entryPoints: entryPoints.flatMap(p => fromPath(path.join(input, p))),
	assetNames: '[dir]/[name]',
	outdir: options.output,
	bundle: true,
	minify: true,
	keepNames: true,
	sourcemap: true,
	format: 'esm',
	loader: {
		'.html': 'copy',
		'.fx': 'copy',
		'.json': 'copy',
		'.cjs': 'copy',
	},
	define: { $build: JSON.stringify(buildOptions) },
	plugins: [
		replace({ include: /\.(css|html|ts)$/, values: { ...getReplacements(buildOptions), _copyright: copyright } }),
		{
			name: 'app-builder-client',
			setup(build: esbuild.PluginBuild) {
				build.onStart(() => {
					fs.cpSync(asset_path, path.join(options.output, buildOptions.asset_dir), { recursive: true });
				});
				build.onEnd(async () => {
					if (options.app) {
						await electronBuilder.build(electronBuilderConfig);
						for (const platform of ['win', 'linux', 'mac']) {
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
						});
						deleteOutput([
							'builder-debug.yml',
							'builder-effective-config.yaml',
							'latest.yml',
							'.icon-ico',
							'tmp',
							`Blankstorm Client Setup ${pkg.version}.exe.blockmap`,
						]);
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
fs.symlinkSync(path.resolve(asset_path), symlinkPath);
// see https://stackoverflow.com/a/34434957/17637456

if (options.watch) {
	console.log('Watching...');
	const ctx = await esbuild.context(esbuildConfig);
	await ctx.watch();
} else {
	await esbuild.build(esbuildConfig);
}
fs.unlinkSync(symlinkPath);
