/* eslint-env node */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('app', {
	require(pkg) {
		return require(pkg);
	},
	getCliOptions() {
		return ipcRenderer.invoke('cli_flags');
	},
});
