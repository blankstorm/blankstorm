import type { SerializedNode } from './Node';
import type { Level, SerializedLevel } from './Level';

export type Listener<Event> = (event: Event) => unknown;

export type ListenerCollection<Event> = Record<string, Listener<Event>>;

export type EventData = { [key: string]: any };

export class LevelEvent extends Event {
	constructor(type: string, public emitter: SerializedNode | SerializedLevel, public data?: EventData, public level?: Level) {
		super(type);
	}
}
