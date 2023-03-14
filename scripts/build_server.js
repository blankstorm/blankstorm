import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/server/index.js'],
  bundle: true,
  outfile: 'dist/tmp/server.js',
  platform: 'node',
});