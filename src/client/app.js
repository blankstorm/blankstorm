/* eslint-env node */
import { app, shell, nativeTheme, ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import { Logger } from 'logzen';

const logger = new Logger();
logger.log('Initializing');

const __dirname = path.resolve(fileURLToPath(import.meta.url), '..');

const { values: options } = parseArgs({
		options: {
			'bs-debug': { type: 'boolean', default: false },
			'bs-open-devtools': { type: 'boolean', default: false },
			'log-level': { type: 'string', default: '0' },
		},
		allowPositionals: true,
		strict: false,
	}),
	initialScale = 100;

app.whenReady().then(() => {
	ipcMain.handle('cli_flags', () => options);
	const window = new BrowserWindow({
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

	window.removeMenu(true);
	window.loadFile(path.join(__dirname, 'index.html'));

	window.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});
	window.setFullScreenable(true);

	const inputHandler = (ev, input) => {
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

	if (options['bs-open-devtools']) {
		window.webContents.toggleDevTools();
	}
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
