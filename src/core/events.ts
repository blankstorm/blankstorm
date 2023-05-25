import type { SerializedNode } from './Node';
import type { Level, SerializedLevel } from './Level';

export type Listener<Event> = (event: Event) => unknown;

export type ListenerCollection<Event> = Record<string, Listener<Event>>;

export class LevelEvent extends Event {
	level?: Level;
	constructor(type: string, public emitter: SerializedNode | SerializedLevel, public data?: { [key: string]: any; level?: Level }) {
		super(type);
		this.level = data?.level;
	}
}
