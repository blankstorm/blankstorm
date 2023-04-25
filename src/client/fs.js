import { configureAsync, BFSRequire } from 'browserfs';

const inBrowser = typeof __fs == 'undefined';
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
export default inBrowser ? BFSRequire('fs') : __fs; //eslint-disable-line no-undef
