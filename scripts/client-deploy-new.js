import { build } from 'esbuild';
import * as fs from 'fs';
import { parseArgs } from 'util';

const { values, positionals } = parseArgs({
	options: {
		verbose: { type: 'boolean', short: 'v', default: false },
		input: { type: 'string', short: 'i', default: 'src/index.html' },
		'output-dir': { type: 'string', short: 'o', default: 'dist/web' },
	},
});

const options = {
	verbose: false,
	input: 'src/index.html',
	'output-dir': 'dist/web',
	...values
}

await build({
	entryPoints: ['src/client/index.js'],
	bundle: true,
	outfile: 'dist/tmp/client.js',
	platform: 'node',
});

fs.cpSync('src/client')

fs.cpSync('src/client/index.html', 'dist/tmp/client.html');
