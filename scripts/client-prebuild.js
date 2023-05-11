import { build } from 'esbuild';
import { readdirSync, statSync } from 'fs';
import { join } from 'path';

function fromPath(path) {
	if (!statSync(path).isDirectory()) {
		return [path];
	}
	const files = [];
	for (let file of readdirSync(path)) {
		const fpath = join(path, file);
		if (statSync(fpath).isDirectory()) {
			files.push(...fromPath(fpath));
		} else {
			files.push(fpath);
		}
	}

	return files;
}

const entryPoints = ['index.js', 'app.cjs', 'preload.cjs', 'index.html', 'images', 'locales', 'models', 'music', 'sfx', 'shaders', 'styles'].flatMap(p =>
	fromPath(join('src/client', p))
);

await build({
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
