import { build } from 'esbuild';

await build({
	entryPoints: ['src/server/index.js'],
	bundle: true,
	outfile: 'dist/tmp/server.js',
	platform: 'node',
});
