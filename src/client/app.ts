/* eslint-env node */
import { BrowserWindow, app, ipcMain, nativeTheme, shell } from 'electron';
import { appendFileSync, existsSync, mkdirSync, truncateSync } from 'fs';
import { LogLevel, Logger, type IOMessage } from 'logzen';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { version, versions } from '../core/metadata';
import type { ClientInit } from './client';

const __dirname: string = resolve(fileURLToPath(import.meta.url), '..');

const options = parseArgs({
	options: {
		dev: { type: 'boolean', default: false },
		logLevel: { type: 'string' },
		quiet: { type: 'boolean', default: false },
		initalScale: { type: 'string', default: '100' },
		path: { type: 'string', default: __dirname },
	},
	allowPositionals: true,
}).values;

// Initial window scale
let initialScale: number = parseInt(options.initalScale);
initialScale = isNaN(initialScale) ? 100 : initialScale;

// Set up logging
const logger = new Logger({ prefix: 'main' });
const logDir: string = join(options.path, 'logs/');
if (!existsSync(logDir)) {
	// This also creates the data directory if it doesn't exist
	mkdirSync(logDir, { recursive: true });
}

const latestLog = join(logDir, 'latest.log');
if (existsSync(latestLog)) {
	truncateSync(latestLog);
}

const logFile = join(logDir, new Date().toISOString().replaceAll(':', '.') + '.log');
logger.on('entry', entry => {
	appendFileSync(latestLog, entry + '\n');
	appendFileSync(logFile, entry + '\n');
});

if (options.quiet || !options.dev) {
	logger.detach(console, [LogLevel.DEBUG, LogLevel.LOG, LogLevel.INFO]);
}

logger.debug('Options: ' + JSON.stringify(options));

if (options.logLevel) {
	logger.warn('CLI flag for log level ignored (unsupported)');
}

logger.log('Initializing...');

ipcMain.handle('options', (): ClientInit => ({ ...options, debug: options.dev }));
ipcMain.handle('log', (ev, msg: IOMessage) => logger.send({ ...msg, computed: null }));

nativeTheme.themeSource = 'dark';

async function init(): Promise<void> {
	const window: BrowserWindow = new BrowserWindow({
		width: 16 * initialScale,
		height: 9 * initialScale,
		center: true,
		darkTheme: true,
		webPreferences: {
			preload: join(__dirname, 'preload.mjs'),
			nodeIntegration: true,
		},
		title: 'Blankstorm Client ' + versions.get(version).text,
		backgroundColor: '#000',
	});

	window.menuBarVisible = false;
	window.fullScreenable = true;
	await window.loadFile(join(__dirname, 'index.html'));

	window.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});
	window.center();
}

app.whenReady().then(init);

app.on('window-all-closed', app.quit);
