import { build, context } from 'esbuild';
import { parseArgs } from 'util';
import { readdirSync, statSync } from 'fs';
import { join, posix } from 'path';

const { values, positionals } = parseArgs({
	options: {
		verbose: { type: 'boolean', short: 'v', default: false },
		watch: { type: 'boolean', short: 'w', default: false },
		output: { type: 'string', short: 'o', default: 'dist/web' },
	},
});

const options = {
		verbose: false,
		output: 'dist/web',
		watch: false,
		...values,
	},
	input = 'src/client';

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

const entryPoints = ['index.js', 'index.html', 'images', 'locales', 'models', 'music', 'sfx', 'styles'].flatMap(p => fromPath(join(input, p)));
const config = {
	entryPoints,
	assetNames: '[dir]/[name]',
	outdir: options.output,
	bundle: true,
	minify: true,
	keepNames: true,
	sourcemap: true,
	format: 'esm',
	loader: Object.fromEntries(['.html', '.png', '.svg', '.fx', '.jpg', '.glb', '.mp3', '.gltf', '.json'].map(e => [e, 'copy'])),
};

if (options.watch) {
	console.log('Watching...');
	const ctx = await context(config);
	await ctx.watch();
} else {
	console.log('Building...');
	await build(config);
	console.log('Built!');
}
