/* eslint-env node */
const { app, shell, nativeTheme, BrowserWindow } = require('electron');
const path = require('path');
const { parseArgs } = require('node:util');

const options = {
		'bs-debug': false,
		'bs-open-devtools': false,
		...parseArgs({
			options: {
				'bs-debug': { type: 'boolean' },
				'bs-open-devtools': { type: 'boolean' },
			},
			allowPositionals: true,
		}).values,
	},
	initialScale = 100;

app.whenReady().then(() => {
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

	window.on('close', () => {
		console.log('Closing... <app>');
		setTimeout(() => app.quit(), 1000);
	});

	window.webContents.on('new-window', (e, url) => {
		e.preventDefault();
		shell.openExternal(url);
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
