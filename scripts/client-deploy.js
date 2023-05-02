import { build, context } from 'esbuild';
import { parseArgs } from 'util';
import { readdirSync } from 'fs';
import { join } from 'path';

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
}, input = 'src/client';

function fromDir(dir){
	return readdirSync(join(input, dir)).map(p => join(dir, p))
}

const config = {
	entryPoints: [ 'index.js', 'index.html', ...fromDir('styles'), ].map(p => join(input, p)),
	assetNames: '[dir]/[name]',
	outdir: options.output,
	bundle: true,
	minify: true,
	keepNames: true,
	sourcemap: true,
	format: 'esm',
	loader: Object.fromEntries(['.html', '.png', '.svg', '.fx', '.jpg', '.glb', '.mp3'].map(e => [e, 'copy'])),
}

if(options.watch){
	console.log('Watching...');
	const ctx = await context(config);
	await ctx.watch();
} else {
	console.log('Building...');
	await build(config);
	console.log('Built!');
}