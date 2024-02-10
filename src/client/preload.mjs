/* eslint-env node */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('$app', {
	require(pkg) {
		return require(pkg);
	},
	options() {
		return ipcRenderer.invoke('options');
	},
	log(entry) {
		return ipcRenderer.invoke('log', entry);
	},
});
