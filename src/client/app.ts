/* eslint-env node */
import { BrowserWindow, app, ipcMain, nativeTheme, shell } from 'electron';
import { appendFileSync, existsSync, mkdirSync, truncateSync } from 'fs';
import { LogLevel, Logger, type IOMessage } from 'logzen';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { version, versions } from '../core/metadata';
import type { ClientInit } from './client';

const dirname: string = resolve(fileURLToPath(import.meta.url), '..');

const _values = parseArgs({
	options: {
		dev: { type: 'boolean', default: false },
		logLevel: { type: 'string' },
		quiet: { type: 'boolean', default: false },
		initalScale: { type: 'string', default: '100' },
		path: { type: 'string', default: dirname },
		help: { type: 'boolean', default: false },
	},
	allowPositionals: true,
}).values;
const options = _values as { [K in keyof typeof _values]: K extends 'logLevel' ? (typeof _values)[K] : Exclude<(typeof _values)[K], undefined> };

if (options.help) {
	console.log(`Options:
	--help					Shows this message
	--dev					Debug mode
	--path <directory>		The directory to use for game data
	--logLevel <level>		Sets log level
	--quiet					Do not write logs to terminal output
	--initalScale <n=100>	The initial scale of the window when multiplied by 16 or 9`);
	process.exit();
}

// Initial window scale
let initialScale: number = parseInt(options.initalScale);
initialScale = isNaN(initialScale) ? 100 : initialScale;

// Set up logging
const logDir: string = join(options.path, 'logs/');
if (!existsSync(logDir)) {
	// This also creates the data directory if it doesn't exist
	mkdirSync(logDir, { recursive: true });
}
const logger = new Logger({ prefix: 'main' });

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
ipcMain.handle('log', (ev, msg: IOMessage) => logger.send({ ...msg, computed: undefined }));

nativeTheme.themeSource = 'dark';

async function init(): Promise<void> {
	const window: BrowserWindow = new BrowserWindow({
		width: 16 * initialScale,
		height: 9 * initialScale,
		center: true,
		darkTheme: true,
		webPreferences: {
			preload: join(dirname, 'preload.mjs'),
			nodeIntegration: true,
		},
		title: 'Blankstorm Client ' + versions.get(version)?.text || version,
		backgroundColor: '#000',
	});

	window.menuBarVisible = false;
	window.fullScreenable = true;
	await window.loadFile(join(dirname, 'index.html'));

	window.webContents.setWindowOpenHandler(({ url }) => {
		shell.openExternal(url);
		return { action: 'deny' };
	});
	window.center();
}

app.whenReady().then(init);

app.on('window-all-closed', app.quit);
