/* eslint-env node */
import { contextBridge, ipcRenderer } from 'electron';
import type { IOMessage } from 'logzen';
import type { ClientInit } from './client';

const app = {
	require,
	options(): Promise<ClientInit> {
		return ipcRenderer.invoke('options');
	},
	log(entry: IOMessage): Promise<void> {
		return ipcRenderer.invoke('log', entry);
	},
} as const;
contextBridge.exposeInMainWorld('$app', app);
export type $app = typeof app;
