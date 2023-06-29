import { configureAsync, BFSRequire } from 'browserfs';
const inBrowser = typeof globalThis._fs == 'undefined';
if (inBrowser) {
	await configureAsync({
		fs: 'AsyncMirror',
		options: {
			sync: {
				fs: 'InMemory',
			},
			async: {
				fs: 'IndexedDB',
			},
		},
	});
}
export default inBrowser ? BFSRequire('fs') : globalThis._fs;
