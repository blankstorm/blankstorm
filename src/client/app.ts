/* eslint-env node */
import { app, shell, nativeTheme, ipcMain, BrowserWindow, Input } from 'electron';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { type IOMessage, LogLevel, Logger } from 'logzen';
import { existsSync, mkdirSync, appendFileSync } from 'fs';
import type { ClientInit } from './client';

const __dirname: string = path.resolve(fileURLToPath(import.meta.url), '..');

const options = parseArgs({
	options: {
		'bs-debug': { type: 'boolean', default: false },
		'log-level': { type: 'string' },
		quiet: { type: 'boolean', default: false },
		'initial-scale': { type: 'string', default: '100' },
		path: { type: 'string', default: __dirname },
	},
	allowPositionals: true,
}).values;

let initialScale: number = parseInt(options['initial-scale'].toString());
initialScale = isNaN(initialScale) ? 100 : initialScale;

const logger = new Logger({ prefix: 'main' });
const logDir: string = path.join(options.path, 'logs/');
if (!existsSync(logDir)) {
	mkdirSync(logDir, { recursive: true });
}
const logPath = `${logDir}/${new Date().toISOString().replaceAll(':', '.')}.log`;
logger.on('entry', entry => appendFileSync(logPath, entry + '\n'));
if (options['bs-debug']) {
	logger.debug('Options: ' + JSON.stringify(options));
}
if (options.quiet) {
	logger.detach(console, [LogLevel.DEBUG, LogLevel.LOG, LogLevel.INFO]);
}

logger.log('Initializing...');

if (options['log-level']) {
	logger.warn('CLI flag "log-level" ignored (unsupported)');
}

app.whenReady().then(() => {
	ipcMain.handle('options', (): ClientInit => ({ ...options, debug: options['bs-debug'] }));
	ipcMain.handle('log', (ev, msg: IOMessage) => logger.send({ ...msg, prefix: 'client', computed: null }));
	const window: BrowserWindow = new BrowserWindow({
		width: 16 * initialScale,
		height: 9 * initialScale,
		center: true,
		darkTheme: true,
		webPreferences: {
			preload: path.join(__dirname, 'preload.mjs'),
			nodeIntegration: true,
		},
	});

	nativeTheme.themeSource = 'dark';

	window.removeMenu();
	window.loadFile(path.join(__dirname, 'index.html'));

	window.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});
	window.setFullScreenable(true);

	const inputHandler = (ev, input: Input) => {
		if (input.type == 'keyUp') {
			return;
		}
		switch (input.key) {
			case 'F12':
				if (options['bs-debug']) {
					window.webContents.toggleDevTools();
				}
				break;
			case 'F11':
				window.fullScreen = !window.fullScreen;
				break;
		}
	};

	window.webContents.on('before-input-event', inputHandler);
	window.webContents.on('devtools-opened', () => {
		window.webContents.devToolsWebContents.on('before-input-event', inputHandler);
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
