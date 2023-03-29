import 'browserfs'; /* global BrowserFS */

const inBrowser = typeof require != 'function';
if (inBrowser) {
	await BrowserFS.configureAsync({
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
export default inBrowser ? BrowserFS.BFSRequire('fs') : require('fs'); // eslint-disable-line
