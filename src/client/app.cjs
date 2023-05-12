/* eslint-env node */
const { app, shell, nativeTheme, BrowserWindow } = require('electron');
const path = require('path')
const { parseArgs } = require('node:util');

const _args = parseArgs({
	options: {
		'bs-debug': { type: 'boolean' },
	},
	allowPositionals: true,
});

const options = {
	'bs-debug': false,
	..._args.values,
};

function createWindow() {
	const win = new BrowserWindow({
		width: 900,
		height: 600,
		center: true,
		darkTheme: true,
		webPreferences: {
			preload: path.join(__dirname, 'preload.cjs'),
			nodeIntegration: true
		},
	});

	nativeTheme.themeSource = 'dark';

	win.removeMenu(true);
	win.loadFile(path.join(__dirname, 'index.html'));

	win.webContents.on('new-window', function (e, url) {
		e.preventDefault();
		shell.openExternal(url);
	});

	const _inputHandler = (ev, input) => {
		switch (input.key) {
			case 'F12':
				if (options['bs-debug']) {
					win.webContents.toggleDevTools();
				}
				break;
			case 'F11':
				win.setFullScreenable(true);
				break;
		}
	};

	win.webContents.on('before-input-event', _inputHandler);
	win.webContents.on('devtools-opened', () => {
		win.webContents.devToolsWebContents.on('before-input-event', _inputHandler);
	});
}

app.whenReady().then(() => {
	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow();
		}
	});
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
