/* eslint-env node */
const { app, nativeTheme, BrowserWindow } = require('electron');

function createWindow() {
	const win = new BrowserWindow({
		width: 900,
		height: 600,
		center: true,
		darkTheme: true
	});

	nativeTheme.themeSource = 'dark';

	win.removeMenu(true);
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
