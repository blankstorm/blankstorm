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
	cookies: {
		async get(this: void, name?: string): Promise<string | undefined> {
			const cookies = (await ipcRenderer.invoke('cookies.get', name)) as Electron.Cookie[];
			return cookies?.[0]?.value;
		},
		set(this: void, name: string, value: string): Promise<void> {
			return ipcRenderer.invoke('cookies.set', name, value);
		},
	},
} as const;
contextBridge.exposeInMainWorld('$app', app);
export type $app = typeof app;
