import EventEmitter from 'node:events';

export enum LogLevel {
	LOG = 0,
	WARN = 1,
	ERROR = 2,
	DEBUG = 3,
	VERBOSE = 4,
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
		const minutes = Math.floor(time % 3600 / 60);
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

	addMessage(message: string, level?: LogLevel, doNotOutput?: boolean): void {
		const entry = new LogEntry(message, level);
		this.#entries.push(entry);
		this.emit('log');

		if ((!doNotOutput && doNotOutput !== false) || !this.doNotOutput) {
			console.log(entry.toString());
		}
	}

	toString(): string {
		return this.entries.map(entry => entry.toString()).join('\n');
	}
}
