import EventEmitter from 'node:events';

export enum LogLevel {
	LOG = 0,
	WARN = 1,
	ERROR = 2,
	DEBUG = 3,
}

export class LogEntry {
	time = performance.now();
	level: LogLevel;
	message: string;
	constructor(message = '', level = LogLevel.LOG) {
		this.message = message;
		this.level = level;
	}

	toString() {
		return `(${this.getTimeString()}) [${LogLevel[this.level]}] ${this.message}`;
	}

	getTimeString() {
		const time = +(this.time / 1000).toFixed();
		const seconds = time % 60;
		const minutes = Math.floor((time % 3600) / 60);
		const hours = Math.floor(time / 3600);
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}
}

export class Log extends EventEmitter {
	#entries: LogEntry[] = [];
	doNotOutput: boolean;

	constructor({ doNotOutput = false } = {}) {
		super();
		this.doNotOutput = doNotOutput;
	}

	get entries(): LogEntry[] {
		return this.#entries.slice(0);
	}

	addMessage(message: string, level?: LogLevel): void {
		const entry = new LogEntry(message, level);
		this.#entries.push(entry);
		this.emit('message');
	}

	log(message: string, doNotOutput?: boolean): void {
		this.addMessage(message, LogLevel.LOG);
		this.emit('log');
		if (!doNotOutput) {
			console.log(message);
		}
	}

	warn(error: Error, doNotOutput?: boolean): void;
	warn(message: string, doNotOutput?: boolean): void;
	warn(message: string | Error, doNotOutput?: boolean): void {
		this.addMessage(message instanceof Error ? message.name : message, LogLevel.WARN);
		this.emit('warn');
		if (!doNotOutput) {
			console.warn(message);
		}
	}

	error(error: Error, doNotOutput?: boolean): void;
	error(message: string, doNotOutput?: boolean): void;
	error(message: string | Error, doNotOutput?: boolean): void {
		this.addMessage(message instanceof Error ? message.stack : message, LogLevel.ERROR);
		this.emit('error');
		if (!doNotOutput) {
			console.error(message);
		}
	}

	debug(message: string, doNotOutput?: boolean): void {
		this.addMessage(message, LogLevel.DEBUG);
		this.emit('debug');
		if (!doNotOutput) {
			console.debug(message);
		}
	}

	toString(): string {
		return this.entries.map(entry => entry.toString()).join('\n');
	}
}
