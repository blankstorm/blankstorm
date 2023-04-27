import { context } from 'esbuild';
import * as fs from 'fs';
import { parseArgs } from 'util';
import path from 'path';

const { values, positionals } = parseArgs({
	options: {
		verbose: { type: 'boolean', short: 'v', default: false },
		output: { type: 'string', short: 'o', default: 'dist/web' },
	},
});

const options = {
		verbose: false,
		output: 'dist/web',
		...values,
	},
	input = 'src/client';

let i = 0;

const ctx = await context({
	entryPoints: [path.join(input, 'index.js')],
	outfile: path.join(options.output, 'index.js'),
	bundle: true,
	minify: true,
	sourcemap: true,
	format: 'esm',
	plugins: [{ name: '_bs_copy_assets', setup(build) {
		console.log(`[${++i}] Rebuilding...`);
		for (let file of ['index.html', 'client.css', 'images', 'locales', 'models', 'music', 'sfx', 'shaders']) {
			const inPath = path.join(input, file), outPath = path.join(options.output, file);
			if (options.verbose) console.log(`Checking ${inPath}...`);
			if(fs.statSync(inPath).mtimeMs == fs.statSync(outPath).mtimeMs) continue;
			if (options.verbose) console.log(`Copying ${inPath}...`);
			fs.cpSync(inPath, outPath, { recursive: true });
		}
	} }],
});

await ctx.watch();
console.log('Watching...');
