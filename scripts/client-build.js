import { build as esbuild } from 'esbuild';
import * as fs from 'fs';
import path from 'path';
import pkg from '../package.json' assert { type: 'json' };
import { version as rawVersion } from '../src/core/meta.js';
import { build } from 'electron-builder';
import { fileURLToPath } from 'url';

const version = rawVersion.replaceAll('_', '-');
function fromPath(p) {
	if (!fs.statSync(p).isDirectory()) {
		return [p];
	}
	const files = [];
	for (let file of fs.readdirSync(p)) {
		const fpath = path.join(p, file);
		if (fs.statSync(fpath).isDirectory()) {
			files.push(...fromPath(fpath));
		} else {
			files.push(fpath);
		}
	}

	return files;
}

const entryPoints = ['index.js', 'app.cjs', 'preload.cjs', 'index.html', 'images', 'locales', 'models', 'music', 'sfx', 'shaders', 'styles'].flatMap(p =>
	fromPath(path.join('src/client', p))
);

await esbuild({
	entryPoints,
	assetNames: '[dir]/[name]',
	outdir: 'dist/tmp/client',
	bundle: true,
	minify: true,
	keepNames: true,
	sourcemap: true,
	format: 'esm',
	loader: Object.fromEntries(['.html', '.png', '.svg', '.fx', '.jpg', '.glb', '.mp3', '.gltf', '.json', '.cjs'].map(e => [e, 'copy'])),
});

await build({
	publish: 'never',
	projectDir: path.resolve(fileURLToPath(import.meta.url), '..', '..'),
	config: {
		extends: null,
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
});

const renames = [
	[`Blankstorm Client Setup ${pkg.version}.exe`, `client-win-${version}.exe`],
	[`Blankstorm Client Setup ${pkg.version}.exe.blockmap`, `client-win-${version}.exe.blockmap`],
	[`Blankstorm Client-${pkg.version}.AppImage`, `client-macos-${version}.AppImage`],
	[`blankstorm-client_${pkg.version}_amd64.snap`, `client-linux-${version}.snap`],
	[`win-unpacked`, `client-win-${version}`],
	[`linux-unpacked`, `client-linux-${version}`],
];

const deletes = ['builder-debug.yml', 'builder-effective-config.yaml', 'latest.yml', '.icon-ico'];

for (let [oldName, newName] of renames) {
	const oldPath = path.join('dist', oldName),
		newPath = path.join('dist', newName);
	if (fs.existsSync(newPath)) {
		fs.rmSync(newPath, { recursive: true, force: true });
	}
	if (fs.existsSync(oldPath)) {
		fs.renameSync(oldPath, newPath);
	}
}

for (let file of deletes) {
	fs.rmSync(path.join('dist', file), { recursive: true, force: true });
}
