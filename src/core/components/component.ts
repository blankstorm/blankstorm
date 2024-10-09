import type { System } from '../system.js';
import { logger } from '../utils.js';

export interface Component<TJSON = unknown> {
	//readonly component: string;

	readonly id?: string;

	update?(): void;

	toJSON(): TJSON;

	fromJSON(data: TJSON): void;
}

export type ComponentData<T extends Component> = T extends Component<infer TJSON> ? TJSON : never;

export interface ComponentStatic<T extends Component = Component> {
	name: string;

	FromJSON(data: ComponentData<T>, system?: System): T;
}

export function isComponent(value: unknown): value is Component {
	return typeof value == 'object' && value != null && 'component' in value && typeof value.component == 'string';
}

export const components = new Map<string, ComponentStatic>();

export function register<Class extends ComponentStatic>(target: Class) {
	logger.debug('Registered component: ' + target.name);
	components.set(target.name, target);
}
