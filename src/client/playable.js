export class PlayableStore extends Map {
	selected;

	constructor() {
		super();
	}
}

export class Playable {
	#store;

	constructor(id, store) {
		this.id = id;
		this.#store = store;
		store.set(id, this);
	}

	getStore() {
		return this.#store;
	}

	delete() {
		this.#store.delete(this.id);
	}
}
