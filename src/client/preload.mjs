/* eslint-env node */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('app', {
	require(pkg) {
		return require(pkg);
	},
	getCliOptions() {
		return ipcRenderer.invoke('cli_flags');
	},
});
