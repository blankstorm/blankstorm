import archiver from 'archiver';
import * as electronBuilder from 'electron-builder';
import * as esbuild from 'esbuild';
import glslPlugin from 'esbuild-plugin-glslx';
import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import $package from '../package.json' assert { type: 'json' };
import { defines, deleteOutput, getVersionInfo, renameOutput } from './common';
const dirname = path.resolve(fileURLToPath(import.meta.url), '..', '..');
const { display: displayVersion, electronBuilder: electronBuilderVersions, fullVersion } = getVersionInfo();

const options = parseArgs({
	options: {
		verbose: { type: 'boolean', short: 'v', default: false },
		watch: { type: 'boolean', short: 'w', default: false },
		output: { type: 'string', short: 'o', default: 'dist/build/client' },
		'no-app': { type: 'boolean', default: false },
		mode: { type: 'string', short: 'm', default: 'dev' },
		debug: { type: 'boolean', default: false },
		keep: { type: 'boolean', short: 'k', default: false },
	},
}).values;
const input = path.posix.join(dirname, 'src/client'),
	asset_path = path.posix.join(dirname, 'dist/build/assets');

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

const productName = 'Blankstorm Client';
const electronBuilderConfig: electronBuilder.CliOptions = {
	publish: 'never',
	projectDir: dirname,
	config: {
		extends: null,
		extraMetadata: {
			main: path.join(options.output, 'app.js'),
			...electronBuilderVersions,
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
		},
		mac: {
			category: 'public.app-category.games',
		},
	},
};

function onBuildStart() {
	try {
		//build assets
		for (const entry of fs.readdirSync(path.join(dirname, 'assets'))) {
			if (entry.startsWith('.')) {
				continue;
			}
			console.log('Exporting assets: ' + entry);
			if (entry == 'models') {
				execSync(`bash ${path.join(dirname, 'assets/models/export.sh')} ${asset_path}/models`, options.verbose ? { stdio: 'inherit' } : null);
				continue;
			}

			fs.cpSync(path.join(dirname, 'assets', entry), path.join(asset_path, entry), { recursive: true });
		}
		fs.cpSync(asset_path, path.join(options.output, 'assets'), { recursive: true });
	} catch (e) {
		if (!('status' in e)) {
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

				console.log('Compressing: ' + platform);
				const archive = archiver('zip', { zlib: { level: 5 } });

				archive.pipe(fs.createWriteStream(`dist/blankstorm-client-${displayVersion}-${platform}.zip`));
				await archive.directory(dirPath, false).finalize();
				console.log('Compressed: ' + platform);
			}
			renameOutput({
				[`${productName} Setup ${fullVersion}.exe`]: `blankstorm-client-${displayVersion}.exe`,
				[`${productName}-${fullVersion}.AppImage`]: `blankstorm-client-${displayVersion}.AppImage`,
				[`${$package.name}_${fullVersion}_amd64.snap`]: `blankstorm-client-${displayVersion}.snap`,
				[`${productName}-${fullVersion}.dmg`]: `blankstorm-client-${displayVersion}.dmg`,
				[`${productName}-${fullVersion}-mac.zip`]: `blankstorm-client-${displayVersion}-mac.zip`,
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
				`${productName} Setup ${fullVersion}.exe.blockmap`,
				`${productName}-${fullVersion}-mac.zip.blockmap`,
				`${productName}-${fullVersion}.dmg.blockmap`,
			]);
		}
	} catch (e) {
		console.error(e);
	}
}

const esbuildConfig = {
	entryPoints: ['index.ts', 'index.html', 'locales', 'styles'].flatMap(p => fromPath(path.join(input, p))),
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
	},
	define: defines(options.mode),
	plugins: [glslPlugin()],
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
} catch (e) {
	console.log('Failed to symlink: ' + e.message);
	console.log('Attempting to copy...');
	fs.cpSync(asset_path, symlinkPath, { recursive: true, force: true });
}

if (options.watch) {
	console.log('Watching...');
	const ctx = await esbuild.context(esbuildConfig);
	const appCtx = await esbuild.context(esbuildAppConfig);
	await Promise.all([ctx.watch(), appCtx.watch()]);
} else {
	await esbuild.build(esbuildConfig);
	await esbuild.build(esbuildAppConfig);
}
if (fs.statSync(symlinkPath).isDirectory()) {
	fs.rmSync(symlinkPath, { recursive: true, force: true });
} else {
	fs.unlinkSync(symlinkPath);
}
