/**
 * @if move to typescript
 * @todo change to enum
 */
export const LogLevel = {
	LOG: 0,
	WARN: 1,
	ERROR: 2,
	DEBUG: 3,
	VERBOSE: 4,
	0: 'LOG',
	1: 'WARN',
	2: 'ERROR',
	3: 'DEBUG',
	4: 'VERBOSE',
}

export class LogEntry {

	time = performance.now();
	level;
	message;
	constructor(message = '', level = LogLevel.LOG){
		this.message = message
		this.level = typeof level == 'number' ? level : LogLevel[level];
	}

	toString(){
		return `(${this.getTimeString()}) [${LogLevel[this.level]}] ${this.message}`;
	}

	getTimeString(){
		const time = parseInt(this.time / 1000);
		const seconds = time % 60;
		const minutes = (time - seconds) % 3600;
		const hours = (time - minutes - seconds) / 3600;
		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
	}

}

export class Log {

	#entries = [];

	constructor(){

	}

	get entries(){
		return this.#entries.slice(0);
	}

	logMessage(message, level, doNotOutput){
		const entry = new LogEntry(message, level);
		this.#entries.push(entry);

		if(!doNotOutput){
			console.log(entry.toString());
		}
	}

	toString()
}

