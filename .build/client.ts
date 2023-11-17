import * as esbuild from 'esbuild';
import * as fs from 'node:fs';
import path from 'node:path';
import pkg from '../package.json' assert { type: 'json' };
import * as electronBuilder from 'electron-builder';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { getOptions, getReplacements } from './options';
import counterPlugin from './counter';
import { deleteOutput, getVersionInfo, renameOutput } from './utils';
import { replace } from 'esbuild-plugin-replace';
import glslPlugin from 'esbuild-plugin-glslx';
import archiver from 'archiver';
import { execSync } from 'node:child_process';
const dirname = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const { display: displayVersion, electronBuilder: electronBuilderVersions, fullVersion } = getVersionInfo();

const options = parseArgs({
		options: {
			verbose: { type: 'boolean', short: 'v', default: false },
			watch: { type: 'boolean', short: 'w', default: false },
			output: { type: 'string', short: 'o', default: 'build/client' },
			'no-app': { type: 'boolean', default: false },
			mode: { type: 'string', short: 'm', default: 'dev' },
			debug: { type: 'boolean', default: false },
			keep: { type: 'boolean', short: 'k', default: false },
		},
	}).values,
	input = path.posix.join(dirname, 'src/client'),
	asset_path = path.posix.join(dirname, 'build/assets');

function fromPath(sourcePath: string): string[] {
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

if (options.keep) {
	console.warn('WARNING: keeping old build files.');
} else {
	fs.rmSync(options.output, { recursive: true, force: true });
}

const copyright = `Copyright © ${new Date().getFullYear()} ${pkg.author}. All Rights Reserved.`;
const electronBuilderConfig: electronBuilder.CliOptions = {
	publish: 'never',
	projectDir: dirname,
	config: {
		extends: null,
		extraMetadata: {
			main: path.posix.join(options.output, '/app.cjs'),
			...electronBuilderVersions,
		},
		files: ['package.json', path.posix.join(options.output, '**/*')],
		appId: 'net.blankstorm',
		productName: 'Blankstorm Client',
		copyright,
		icon: './icon.png',
		nsis: {
			oneClick: false,
			allowToChangeInstallationDirectory: true,
			removeDefaultUninstallWelcomePage: true,
			deleteAppDataOnUninstall: true,
		},
		executableName: 'blankstorm-client',
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
	define: { $build: JSON.stringify(buildOptions), $package: JSON.stringify(pkg) },
	plugins: [
		glslPlugin(),
		replace({ include: /\.(css|html|ts)$/, values: { ...getReplacements(buildOptions), _copyright: copyright } }),
		{
			name: 'app-builder-client',
			setup(build: esbuild.PluginBuild) {
				build.onStart(() => {
					try {
						//build assets
						for (const f of fs.readdirSync(path.join(dirname, 'assets'))) {
							if (f.startsWith('.')) {
								continue;
							}
							console.log('Exporting assets: ' + f);
							if (f == 'models') {
								execSync('bash ' + path.join(dirname, 'assets/models/export.sh'), options.verbose ? { stdio: 'inherit' } : null);
								continue;
							}

							fs.cpSync(path.join(dirname, 'assets', f), path.join(asset_path, f), { recursive: true });
						}
						fs.cpSync(asset_path, path.join(options.output, buildOptions.asset_dir), { recursive: true });
					} catch (e) {
						if (!('status' in e)) {
							console.error(e);
						}
					}
				});
				build.onEnd(async () => {
					try {
						if (!options['no-app']) {
							await electronBuilder.build(electronBuilderConfig);
							for (const platform of ['win', 'linux']) {
								renameOutput({ [`${platform}-unpacked`]: `blankstorm-client-${displayVersion}-${platform}` });
								const dirPath = `dist/blankstorm-client-${displayVersion}-${platform}`;
								if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
									continue;
								}

								console.log('Compressing: ' + platform);
								const archive = archiver('zip', { zlib: { level: 9 } });

								archive.pipe(fs.createWriteStream(`dist/blankstorm-client-${displayVersion}-${platform}.zip`));
								await archive.directory(dirPath, false).finalize();
								console.log('Compressed: ' + platform);
							}
							renameOutput({
								[`Blankstorm Client Setup ${fullVersion}.exe`]: `blankstorm-client-${displayVersion}.exe`,
								[`Blankstorm Client-${fullVersion}.AppImage`]: `blankstorm-client-${displayVersion}.AppImage`,
								[`blankstorm-client_${fullVersion}_amd64.snap`]: `blankstorm-client-${displayVersion}.snap`,
								[`Blankstorm Client-${fullVersion}.dmg`]: `blankstorm-client-${displayVersion}.dmg`,
								[`Blankstorm Client-${fullVersion}-mac.zip`]: `blankstorm-client-${displayVersion}-mac.zip`,
							});
							deleteOutput([
								'__snap-amd64',
								'builder-debug.yml',
								'builder-effective-config.yaml',
								'latest.yml',
								'latest-mac.yml',
								'.icon-ico',
								'tmp',
								`Blankstorm Client Setup ${fullVersion}.exe.blockmap`,
								`Blankstorm Client-${fullVersion}-mac.zip.blockmap`,
								`Blankstorm Client-${fullVersion}.dmg.blockmap`,
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
	if (fs.statSync(symlinkPath).isDirectory()) {
		fs.rmSync(symlinkPath, { recursive: true, force: true });
	} else {
		fs.unlinkSync(symlinkPath);
	}
}
if (!fs.existsSync(asset_path)) {
	fs.mkdirSync(asset_path, { recursive: true });
}
try {
	fs.symlinkSync(asset_path, symlinkPath);
} catch (e) {
	console.log('Failed to symlink: ' + e.message);
	console.log('Attempting to copy...');
	fs.cpSync(asset_path, symlinkPath, { recursive: true, force: true });
}

if (options.watch) {
	console.log('Watching...');
	const ctx = await esbuild.context(esbuildConfig);
	await ctx.watch();
} else {
	await esbuild.build(esbuildConfig);
}
if (fs.statSync(symlinkPath).isDirectory()) {
	fs.rmSync(symlinkPath, { recursive: true, force: true });
} else {
	fs.unlinkSync(symlinkPath);
}
