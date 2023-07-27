/* eslint-env node */
const { contextBridge } = require('electron');

const allowedToRequire = ['fs'];

contextBridge.exposeInMainWorld('_require', pkg => {
	if (allowedToRequire.includes(pkg)) {
		return require(pkg);
	}
});
