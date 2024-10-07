import * as electronBuilder from 'electron-builder';
import * as esbuild from 'esbuild';
import glslPlugin from 'esbuild-plugin-glslx';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import path, { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import $package from '../package.json' assert { type: 'json' };
import { defines, deleteOutput, renameOutput, version } from './build-common';
const root = path.resolve(fileURLToPath(import.meta.url), '..', '..');

const displayVersion = version.display.replaceAll(' ', '-').toLowerCase();

const { values: _values } = parseArgs({
	options: {
		verbose: { type: 'boolean', short: 'v', default: false },
		watch: { type: 'boolean', short: 'w', default: false },
		output: { type: 'string', short: 'o', default: 'build/client' },
		'no-app': { type: 'boolean', default: false },
		mode: { type: 'string', short: 'm', default: 'dev' },
		debug: { type: 'boolean', default: false },
		keep: { type: 'boolean', short: 'k', default: false },
	},
});
const options = _values as { [K in keyof typeof _values]: Exclude<(typeof _values)[K], undefined> };
const input = path.posix.join(root, 'src/client'),
	asset_path = path.posix.join(root, 'build/assets');

function fromPath(sourcePath: string): string[] {
	if (!fs.statSync(sourcePath).isDirectory()) {
		return [sourcePath];
	}
	const files: string[] = [];
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

const productName = 'blankstorm',
	shortVersion = 'type' in version ? '0.' + version.core : version.core + '.0';
const electronBuilderConfig: electronBuilder.CliOptions = {
	publish: 'never',
	projectDir: root,
	config: {
		extends: null,
		extraMetadata: {
			main: path.join(options.output, 'app.js'),
			version: $package.version,
			shortVersion,
			shortVersionWindows: shortVersion,
		},
		files: ['package.json', path.join(options.output, '**/*')],
		appId: 'net.blankstorm.client',
		productName,
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
			executableName: 'blankstorm-client',
		},
		mac: {
			category: 'public.app-category.games',
		},
	},
	linux: ['zip', 'AppImage', 'snap', 'deb', 'rpm', 'pacman'],
	win: ['zip', 'nsis'],
};

function onBuildStart() {
	try {
		//build assets
		for (const entry of fs.readdirSync(path.join(root, 'assets'))) {
			if (entry.startsWith('.')) {
				continue;
			}
			console.log('Exporting assets: ' + entry);
			if (entry == 'models') {
				execSync(`bash ${path.join(root, 'assets/models/export.sh')} ${asset_path}/models`, options.verbose ? { stdio: 'inherit' } : undefined);
				continue;
			}

			fs.cpSync(path.join(root, 'assets', entry), path.join(asset_path, entry), { recursive: true });
		}
		fs.cpSync(asset_path, path.join(options.output, 'assets'), { recursive: true });

		// locales
		console.log('Copying locales...');
		fs.cpSync(path.join(input, 'locales'), path.join(options.output, 'locales'), { recursive: true });
	} catch (e) {
		if (typeof e == 'object' && e != null && !('status' in e)) {
			console.error(e);
		}
	}
}

async function onBuildEnd() {
	try {
		fs.renameSync(path.join(options.output, 'preload.js'), path.join(options.output, 'preload.mjs'));
		if (!options['no-app']) {
			await electronBuilder.build(electronBuilderConfig);
			for (const platform of ['win', 'linux']) {
				renameOutput({ [`${platform}-unpacked`]: `blankstorm-client-${displayVersion}-${platform}` });
				const dirPath = `dist/blankstorm-client-${displayVersion}-${platform}`;
				if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
					continue;
				}
			}
			renameOutput({
				[`${productName} Setup ${version.full}.exe`]: `blankstorm-client-${displayVersion}.exe`,
				[`${productName}-${version.full}.AppImage`]: `blankstorm-client-${displayVersion}.AppImage`,
				[`${$package.name}_${version.full}_amd64.snap`]: `blankstorm-client-${displayVersion}.snap`,
				[`${$package.name}_${version.full}_amd64.deb`]: `blankstorm-client-${displayVersion}.deb`,
				[`${$package.name}-${version.full}.x86_64.rpm`]: `blankstorm-client-${displayVersion}.x86_64.rpm`,
				[`${$package.name}-${version.full}.pacman`]: `blankstorm-client-${displayVersion}.pacman`,
				[`${productName}-${version.full}-arm64.dmg`]: `blankstorm-client-${displayVersion}.dmg`,
				[`${productName}-${version.full}-win.zip`]: `blankstorm-client-${displayVersion}-win.zip`,
				[`${$package.name}-${version.full}.zip`]: `blankstorm-client-${displayVersion}-linux.zip`,
				[`${productName}-${version.full}-mac.zip`]: `blankstorm-client-${displayVersion}-mac.zip`,
			});
			deleteOutput([
				'__snap-amd64',
				'builder-debug.yml',
				'builder-effective-config.yaml',
				'latest.yml',
				'latest-mac.yml',
				'latest-linux.yml',
				'.icon-ico',
				'tmp',
				`${productName} Setup ${version.full}.exe.blockmap`,
				`${productName}-${version.full}-mac.zip.blockmap`,
				`${productName}-${version.full}.dmg.blockmap`,
			]);
		}
	} catch (e) {
		console.error(e);
	}
}

const esbuildConfig = {
	entryPoints: ['index.ts', 'index.html', 'styles'].flatMap(p => fromPath(path.join(input, p))),
	assetNames: '[dir]/[name]',
	outdir: options.output,
	bundle: true,
	minify: !options.debug,
	keepNames: true,
	sourcemap: true,
	format: 'esm',
	loader: { '.html': 'copy' },
	alias: {
		'~': root + '/src',
	},
	define: defines(options.mode),
	plugins: [
		glslPlugin(),
		{
			name: 'node-import-transform',
			setup(build) {
				const nodeImportRegex = /import\s+(?:\*\s+as\s+(\w+)|(\{[^}]+\}))\s+from\s+['"](node:[^'"]+|fs)['"];/g;

				build.onLoad({ filter: /\.[tj]s$/ }, ({ path }) => {
					const original = fs.readFileSync(path, 'utf8');
					if (original.includes('/* eslint-env node */') || path.includes('src/core') || path.includes('src/server')) {
						return;
					}
					const contents = original.replaceAll(nodeImportRegex, (match, ns, bindings, specifier) => {
						const newImport = `const ${ns || bindings} = $app.require('${specifier}');`;
						if (options.verbose) {
							console.log(`Transforming: ${match} -> ${newImport} (${relative(root, path).replaceAll('node_modules/', '')})`);
						}
						return newImport;
					});

					return { contents, loader: path.endsWith('.ts') ? 'ts' : 'js' };
				});
			},
		},
	],
} satisfies esbuild.BuildOptions;

const esbuildAppConfig = {
	...esbuildConfig,
	entryPoints: ['app.ts', 'preload.ts'].map(p => path.join(input, p)),
	packages: 'external',
	plugins: [
		...esbuildConfig.plugins,
		{
			name: 'app-builder-client',
			setup({ onStart, onEnd }: esbuild.PluginBuild) {
				onStart(onBuildStart);
				onEnd(onBuildEnd);
			},
		},
	],
} satisfies esbuild.BuildOptions;

const symlinkPath = path.join(input, 'assets');
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
} catch (_error) {
	const error = _error as Error;
	console.log('Failed to symlink: ' + error);
	console.log('Attempting to copy...');
	fs.cpSync(asset_path, symlinkPath, { recursive: true, force: true });
}

if (options.watch) {
	const ctx = await esbuild.context(esbuildConfig);
	const app = await esbuild.context(esbuildAppConfig);
	console.log('Watching...');
	await Promise.all([ctx.watch(), app.watch()]);
} else {
	await esbuild.build(esbuildConfig);
	await esbuild.build(esbuildAppConfig);
}
if (fs.statSync(symlinkPath).isDirectory()) {
	fs.rmSync(symlinkPath, { recursive: true, force: true });
} else {
	fs.unlinkSync(symlinkPath);
}
