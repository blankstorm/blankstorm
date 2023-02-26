/* eslint-env node */
const { app, nativeTheme, BrowserWindow } = require('electron');
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
	});

	nativeTheme.themeSource = 'dark';

	win.removeMenu(true);
	win.loadFile('src/client/index.html');

	if (options['bs-debug']) {
		win.webContents.openDevTools();
	}
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
