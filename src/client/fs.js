import 'browserfs'; /* global BrowserFS */

const inBrowser = eval?.('!!window');
try {
	if (inBrowser) {
		await new Promise(resolve => BrowserFS.configure({
			fs: 'AsyncMirror',
			options: {
				sync: {
					fs: 'InMemory',
				},
				async: {
					fs: 'IndexedDB',
				},
			},
		}, resolve));
	}
} catch (err) {
	console.error('Failed to initalize FS: ' + err);
}
export default inBrowser ? BrowserFS.BFSRequire('fs') : import('fs');