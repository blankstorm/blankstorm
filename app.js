/* eslint-env node */
const { app, BrowserWindow } = require('electron');

function createWindow() {
	const win = new BrowserWindow({
		width: 900,
		height: 600,
	});

	win.loadFile('src/index.html');
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
