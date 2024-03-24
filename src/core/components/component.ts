import EventEmitter from 'eventemitter3';
import type { Entity } from '../entities/Entity';

export type ComponentData<C extends Component = Component> = C extends Component<infer TData> ? TData : unknown;

export type ComponentsData<TComponents extends Record<string, Component>> = {
	[K in keyof TComponents]: ComponentData<TComponents[K]>;
};

export abstract class Component<TData = unknown> extends EventEmitter {
	public get type(): string {
		return this.constructor.name.toLowerCase();
	}

	protected get _(): Entity {
		return this._entity;
	}

	public constructor(public readonly _entity: Entity, init: TData) {
		super();
		this.from(init);
	}

	public abstract data(): TData;

	public abstract from(data: TData): void;
}

export class NullComponent extends Component<null> {
	public data(): null {
		return;
	}

	public from(): void {
		return;
	}
}

export function register<C extends new (...args) => Component>(name?: string) {
	return function (component: C) {
		componentsRegistry.set(name || component.name.toLowerCase(), component);
	};
}

export const componentsRegistry: Map<string, new (...args) => Component> = new Map();
