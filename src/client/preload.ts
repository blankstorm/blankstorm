/* eslint-env node */
import { contextBridge, ipcRenderer } from 'electron';
import type { IOMessage } from 'logzen';
import type { ClientInit } from './client';

const app = {
	require,
	options(this: void): Promise<ClientInit> {
		return ipcRenderer.invoke('options');
	},
	log(this: void, entry: IOMessage): void {
		void ipcRenderer.invoke('log', entry);
	},
} as const;
contextBridge.exposeInMainWorld('$app', app);
export type $app = typeof app;
