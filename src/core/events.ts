import type { SerializedNode } from './Node';
import type { Level, SerializedLevel } from './Level';

export type Listener<Event> = (event: Event) => unknown;

export type ListenerCollection<Event> = Record<string, Listener<Event>>;

export type LevelEventData = { [key: string]: any };

export class LevelEvent extends Event {
	constructor(type: string, public emitter: SerializedNode | SerializedLevel, public data?: LevelEventData, public level?: Level) {
		super(type);
	}
}
