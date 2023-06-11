import type { SerializedNode } from './nodes/Node';
import type { Level } from './Level';
import type { SerializedSystem } from './System';

export type Listener<Event> = (event: Event) => unknown;

export type ListenerCollection<Event> = Record<string, Listener<Event>>;

export type EventData = { [key: string]: any };

export class LevelEvent extends Event {
	constructor(type: string, public emitter: SerializedNode | SerializedSystem, public data?: EventData, public level?: Level) {
		super(type);
	}
}
