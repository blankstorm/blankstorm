/* eslint-env node */
import { contextBridge, ipcRenderer } from 'electron';

const app: typeof $app = {
	require,
	options() {
		return ipcRenderer.invoke('options');
	},
	log(entry) {
		return ipcRenderer.invoke('log', entry);
	},
};

contextBridge.exposeInMainWorld('$app', app);
