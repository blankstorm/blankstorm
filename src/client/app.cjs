/* eslint-env node */
const { app, shell, nativeTheme, ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const { parseArgs } = require('node:util');

const { values: options } = parseArgs({
		options: {
			'bs-debug': { type: 'boolean', default: false },
			'bs-open-devtools': { type: 'boolean', default: false },
			'log-level': { type: 'number', default: 0 },
		},
		allowPositionals: true,
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
			preload: path.join(__dirname, 'preload.cjs'),
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

	window.webContents.on('console-message', (...args) => {
		//const [event, level, message, line] = args;
		//console.log(typeof message);
	});

	const inputHandler = (ev, input) => {
		switch (input.key) {
			case 'F12':
				if (options['bs-debug']) {
					window.webContents.toggleDevTools();
				}
				break;
			case 'F11':
				window.setFullScreenable(true);
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
