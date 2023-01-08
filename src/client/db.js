IDBRequest.prototype.async = function () {
	return new Promise((resolve, reject) => {
		this.onsuccess = () => resolve(this.result);
		this.onerror = () => reject(this.error);
	});
};
export default {
	_db: null,
	async init() {
		const req = indexedDB.open('blankstorm', 3);
		req.onupgradeneeded = e => {
			let idb = req.result;
			switch (e.oldVersion) {
				case 3:
					if (idb.objectStoreNames.contains('settings')) idb.deleteObjectStore('settings');
					break;
				case 2:
					if (idb.objectStoreNames.contains('locales')) idb.deleteObjectStore('locales');
					break;
				case 0:
					idb.createObjectStore('servers');
					idb.createObjectStore('saves');
					idb.createObjectStore('mods');
			}
		};
		const result = await req.async();
		this._db = result;
	},
	async _get() {
		while (!(this._db instanceof IDBDatabase)) {
			//Wait for it
		}
		return this._db;
	},
	async tx(stores, mode) {
		let db = await this._get();
		return db.transaction(stores, mode);
	},
};
