import { Component, registerComponent } from 'deltablank/core/component.js';
import type { Entity, EntityJSON } from 'deltablank/core/entity.js';
import { map } from 'utilium';
import type { ItemContainer, ItemID } from '../data';
import { items } from '../data';

interface StorageJSON {
	items: Record<ItemID, number>;
	max_items: number;
}

interface StorageMixin {
	storage: ItemStorage;
}

/**
 * Generic class for something that stores items
 */
@registerComponent
export abstract class ItemStorage extends Component<StorageMixin, StorageJSON, { max_items: number }> implements ItemContainer {
	public get [Symbol.toStringTag](): string {
		return 'ItemStorage';
	}

	public toString(): string {
		return 'Storage' + JSON.stringify(this.items);
	}

	public abstract max: number;

	public abstract get items(): Record<ItemID, number>;

	setup(): StorageMixin {
		return { storage: this };
	}

	load(data: EntityJSON & StorageJSON): void {
		this.clear();
		this.max = data.max_items;
		for (const [id, amount] of map(data.items)) {
			this.add(id, amount);
		}
	}

	public toJSON(): StorageJSON {
		return {
			items: this.items,
			max_items: this.max,
		};
	}

	public clear(...filter: ItemID[]) {
		for (const id of this.keys()) {
			if (!filter.length || filter.includes(id)) {
				this.remove(id);
			}
		}
	}

	protected get total(): number {
		let total = 0;
		for (const [id, amount] of this) {
			total += amount * items.get(id)!.weight;
		}
		return total;
	}

	public count(item?: ItemID): number {
		return (item ? this.items[item] : this.total) || 0;
	}

	public abstract add(item: ItemID, amount: number): void;

	public addItems(items: Partial<Record<ItemID, number>>) {
		for (const [id, amount] of map(items)) {
			this.add(id, amount!);
		}
	}

	public has(item: ItemID, amount: number = 1): boolean {
		return this.count(item) >= amount;
	}

	public hasItems(items: Partial<Record<ItemID, number>>) {
		for (const [id, amount] of map(items)) {
			if (!this.has(id, amount)) {
				return false;
			}
		}
	}

	public abstract remove(item: ItemID, amount?: number): void;

	public removeItems(items: Partial<Record<ItemID, number>>) {
		for (const [id, amount] of map(items)) {
			this.remove(id, amount);
		}
	}

	public entries(): IterableIterator<[ItemID, number]> {
		return map(this.items).entries();
	}

	public keys(): IterableIterator<ItemID> {
		return map(this.items).keys();
	}

	public values(): IterableIterator<number> {
		return map(this.items).values();
	}

	public [Symbol.iterator](): IterableIterator<[ItemID, number]> {
		return map(this.items).entries();
	}
}

/**
 * Duh- stores items
 */
export class Container extends ItemStorage {
	protected _items: Map<ItemID, number> = new Map();

	public get max(): number {
		return this.config.max_items;
	}

	public get items(): Record<ItemID, number> {
		return Object.fromEntries<number>(this._items) as Record<ItemID, number>;
	}

	public add(item: ItemID, amount: number) {
		this._items.set(item, this.count(item) + amount);
	}

	public remove(item: ItemID, amount?: number) {
		this._items.set(item, typeof amount == 'number' ? this.count(item) - amount : 0);
	}
}

/**
 * Manages the storage for a group of other storages
 */
export class StorageManager extends ItemStorage {
	protected storages: Set<ItemStorage> = new Set();

	public get items(): Record<ItemID, number> {
		const _items = Object.fromEntries(Object.keys(items).map(i => [i, 0])) as Record<ItemID, number>;
		for (const storage of this.storages) {
			for (const name of Object.keys(items) as ItemID[]) {
				_items[name] += storage.count(name);
			}
		}
		return _items;
	}

	public get total(): number {
		let total = 0;
		for (const storage of this.storages) {
			total += storage.count();
		}
		return total;
	}

	public get max(): number {
		let total = 0;
		for (const storage of this.storages) {
			total += storage.max;
		}
		return total;
	}

	public add(item: ItemID, amount: number): void {
		for (const storage of this.storages) {
			const space = storage.max - storage.count();
			if (space <= 0) {
				continue;
			}
			if (!items.has(item)) {
				console.warn('Failed to add invalid item to storage: ' + item);
				continue;
			}
			const amountToStore = Math.min(space, amount);
			storage.add(item, amountToStore);
			amount -= amountToStore;
		}
	}

	public remove(item: ItemID, amount?: number): void {
		for (const storage of this.storages) {
			const stored = Math.min(storage.count(item), amount ?? storage.count(item));
			storage.remove(item, stored);
			if (typeof amount == 'number') {
				amount -= stored;
			}
		}
	}
}

/**
 * Manages the storage for a group of entities
 */
export class EntityStorageManager extends ItemStorage {
	protected entities: Iterable<Entity & StorageMixin> = new Set();

	public get items(): Record<ItemID, number> {
		const _items = Object.fromEntries(Object.keys(items).map(i => [i, 0])) as Record<ItemID, number>;
		for (const entity of this.entities) {
			for (const name of Object.keys(items) as ItemID[]) {
				_items[name] += entity.storage.count(name);
			}
		}
		return _items;
	}

	public get total(): number {
		let total = 0;
		for (const entity of this.entities) {
			total += entity.storage.count();
		}
		return total;
	}

	public get max(): number {
		let total = 0;
		for (const entity of this.entities) {
			total += entity.storage.max;
		}
		return total;
	}

	public add(item: ItemID, amount: number): void {
		for (const entity of this.entities) {
			const space = entity.storage.max - entity.storage.count();
			if (space <= 0) {
				continue;
			}
			if (!items.has(item)) {
				console.warn('Failed to add invalid item to storage: ' + item);
				continue;
			}
			const amountToStore = Math.min(space, amount);
			entity.storage.add(item, amountToStore);
			amount -= amountToStore;
		}
	}

	public remove(item: ItemID, amount?: number): void {
		for (const entity of this.entities) {
			const stored = Math.min(entity.storage.count(item), amount ?? entity.storage.count(item));
			entity.storage.remove(item, stored);
			if (typeof amount == 'number') {
				amount -= stored;
			}
		}
	}
}
