export class LevelEvent extends Event {
	constructor(type, emitter, data) {
		super(type);
		this.emitter = emitter;
		this.level = emitter?.level || data?.level;
		this.data = data;
	}
}
