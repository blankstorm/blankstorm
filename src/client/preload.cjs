/* eslint-env node */
const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('_require', pkg => {
	return require(pkg);
});
