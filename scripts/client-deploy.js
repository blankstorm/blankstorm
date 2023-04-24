import { build } from 'esbuild';
import * as fs from 'fs';
import { parseArgs } from 'util';
import path from 'path';
import ignorePlugin from 'esbuild-plugin-ignore';

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
};

const input = 'src/client';
console.log('Building...');
await build({
	entryPoints: [path.join(input, 'index.js')],
	outfile: path.join(options.output, 'client.js'),
	bundle: true,
	minify: true,
	format: 'esm',
	external: ['fs' ]
});

console.log('Copying assets...');
for (let file of ['index.html', 'client.css', 'images', 'locales', 'models', 'music', 'sfx', 'shaders']) {
	if(options.verbose) console.log(`Copying ${path.join(input, file)}`);
	fs.cpSync(path.join(input, file), path.join(options.output, file), { recursive: true });
}
