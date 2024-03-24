import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import EventEmitter from 'eventemitter3';
import { Level } from '../Level';
import { Component, ComponentsData } from '../components/component';
import { componentsRegistry } from '../components/component';
import { NTuple3, randomHex, type Entries } from '../utils';
import type { System } from '../System';
import type { WellKnownComponents as WellKnown } from '../components/well-known';
import type { Combat } from '../components/combat';
import type { Fleet } from '../components/fleet';
import type { Jump } from '../components/jump';
import type { Move } from '../components/move';
import type { Experience } from '../components/xp';
import type { Storage } from '../components/storage';
import type { ResearchID } from '../generic/research';
import type { Hardpoint } from './Hardpoint';

export type ComponentsOf<TEntity> = TEntity extends Entity<infer TComponents> ? TComponents : never;

export interface EntityData<TEntity extends Entity = Entity> {
	id: string;
	name?: string;
	position: NTuple3;
	rotation: NTuple3;
	velocity: NTuple3;
	components: ComponentsData<ComponentsOf<TEntity>>;
}

export class Entity<TComponents extends Record<string, Component> = Record<string, Component>> extends EventEmitter {
	public name?: string;

	protected _level: Level;
	public get level(): Level {
		return this._level;
	}
	public set level(value: Level) {
		if (this._level) {
			this._level.entities.delete(this);
			this._level.emit('node.removed', this.toJSON());
		}
		this._level = value;
		if (value) {
			value.entities.add(this);
			setTimeout(() => value.emit('node.added', this.toJSON()));
		}
	}

	protected _system: string;
	public get system(): System {
		return this.level.systems.get(this._system);
	}
	public set system(value: System | string) {
		this._system = typeof value == 'object' ? value.id : value;
	}

	public get system_id(): string {
		return this._system;
	}

	public parent?: Entity;

	position = Vector3.Zero();
	get absolutePosition(): Vector3 {
		return this.parent instanceof Entity ? this.parent.absolutePosition.add(this.position) : this.position;
	}

	rotation = Vector3.Zero();
	get absoluteRotation(): Vector3 {
		return this.parent instanceof Entity ? this.parent.absoluteRotation.add(this.rotation) : this.rotation;
	}

	velocity = Vector3.Zero();
	get absoluteVelocity(): Vector3 {
		return this.parent instanceof Entity ? this.parent.absoluteVelocity.add(this.rotation) : this.rotation;
	}

	remove() {
		this.level = null;
	}

	protected _components: Map<string, Component>;

	constructor(public id: string = randomHex(32), level: Level, compontents?: ComponentsData<TComponents>) {
		super();
		for (const [type, init] of <Entries<typeof compontents>>Object.entries(compontents)) {
			const Component = componentsRegistry.get(type.toString());
			const component = new Component(this);
			component.from(init);
		}
		this.level = level;
		setTimeout(() => level.emit('node.created', this.toJSON()));
	}

	get<K extends keyof WellKnown>(type: K): WellKnown[K] | null;
	get<K extends keyof TComponents>(type: K): TComponents[K];
	get<C extends Component>(type: string): C;
	get<K extends keyof TComponents>(type: K): TComponents[K] {
		return <TComponents[K]>this._components.get(type.toString());
	}

	set<const K extends keyof TComponents | string>(type: K, component: Component): void {
		this._components.set(type.toString(), component);
	}

	add(component: Component): void {
		this._components.set(component.type, component);
	}

	delete(type: keyof TComponents | string): boolean;
	delete(component: Component): boolean;
	delete(component: string | keyof TComponents | Component): boolean {
		const type = component instanceof Component ? component.type : component;
		return this._components.delete(type.toString());
	}

	has(type: keyof TComponents | string): boolean {
		return this._components.has(type.toString());
	}

	toJSON(): EntityData {
		return {
			id: this.id,
			name: this.name,
			position: this.position.asArray(),
			rotation: this.rotation.asArray(),
			velocity: this.velocity.asArray(),
			components: Object.fromEntries(Array.from(this._components).map(([type, c]) => [type, c.data()])),
		};
	}

	static FromJSON<TEntity extends Entity, TClass extends new (...args) => TEntity>(this: TClass, data: EntityData<TEntity>, level: Level): TEntity {
		const entity = new this(data.id, level, data.components);
		entity.name = data.name;
		entity.position = Vector3.FromArray(data.position || [0, 0, 0]);
		entity.rotation = Vector3.FromArray(data.rotation || [0, 0, 0]);
		entity.velocity = Vector3.FromArray(data.velocity || [0, 0, 0]);
		return entity;
	}

	/*
		Well-known components
	*/

	public get captured(): boolean {
		if (!this.has('capture')) {
			throw new ReferenceError('Component "capture" not available');
		}
		return this.get('capture').is;
	}
	public set captured(value: boolean) {
		if (!this.has('capture')) {
			throw new ReferenceError('Component "capture" not available');
		}
		this.get('capture').is = value;
	}
	public get combat(): Combat {
		if (!this.has('combat')) {
			throw new ReferenceError('Component "combat" not available');
		}
		return this.get('combat');
	}
	public get fleet(): Fleet {
		if (!this.has('fleet')) {
			throw new ReferenceError('Component "fleet" not available');
		}
		return this.get('fleet');
	}
	public get hardpoints(): Set<Hardpoint> {
		if (!this.has('hardpoints')) {
			throw new ReferenceError('Component "hardpoints" not available');
		}
		return this.get('hardpoints').points;
	}
	public get jump(): Jump {
		if (!this.has('jump')) {
			throw new ReferenceError('Component "jump" not available');
		}
		return this.get('jump');
	}
	public get move(): Move {
		if (!this.has('move')) {
			throw new ReferenceError('Component "move" not available');
		}
		return this.get('move');
	}
	public get owner(): Entity {
		if (!this.has('owner')) {
			throw new ReferenceError('Component "owner" not available');
		}
		return this.get('owner').owner;
	}
	public set owner(value: Entity) {
		if (!this.has('owner')) {
			throw new ReferenceError('Component "owner" not available');
		}
		this.get('owner').owner = value;
	}
	public get research(): Record<ResearchID, number> {
		if (!this.has('research')) {
			throw new ReferenceError('Component "research" not available');
		}
		return this.get('research').research;
	}
	public get selected(): boolean {
		if (!this.has('select')) {
			throw new ReferenceError('Component "select" not available');
		}
		return this.get('select').is;
	}
	public set selected(value: boolean) {
		if (!this.has('select')) {
			throw new ReferenceError('Component "select" not available');
		}
		this.get('select').is = value;
	}
	public get storage(): Storage {
		if (!this.has('storage')) {
			throw new ReferenceError('Component "storage" not available');
		}
		return this.get('storage');
	}
	public get xp(): Experience {
		if (!this.has('xp')) {
			throw new ReferenceError('Component "xp" not available');
		}
		return this.get('xp');
	}
}
