import type { SerializedNode } from './Node';
import type { Level } from './Level';
export class LevelEvent extends Event {
	emitter: SerializedNode;
	level: Level;
	data: object;
	constructor(type: string, emitter: any, data?: { [key: string]: unknown; level?: Level }) {
		super(type);
		this.emitter = emitter;
		this.level = emitter?.level || data?.level;
		this.data = data;
	}
}
